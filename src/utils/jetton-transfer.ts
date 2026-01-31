import { JettonBalance } from "@ton-api/client";
import { beginCell, Address, toNano } from "@ton/core";
import { SendTransactionRequest } from "@tonconnect/ui-react";
import { fromDecimals } from "../utility/decimals";
import { isValidAddress } from "../utility/address";

export const getJettonTransaction = (
  jetton: JettonBalance,
  amountStr: string,
  recipientAddressStr: string,
  senderAddress: Address
): SendTransactionRequest => {
  const amount = fromDecimals(amountStr, jetton.jetton.decimals);

  if (!isValidAddress(recipientAddressStr)) {
    throw new Error("Invalid recipient address format");
  }

  if (amount <= 0n) {
    throw new Error("Amount must be greater than zero");
  }

  if (amount > jetton.balance) {
    throw new Error("Amount exceeds available balance");
  }

  const recipient = Address.parse(recipientAddressStr);

  const body = beginCell()
    .storeUint(0xf8a7ea5, 32) // jetton transfer operation
    .storeUint(0, 64) // query ID
    .storeCoins(amount) // jetton amount
    .storeAddress(recipient) // destination address
    .storeAddress(senderAddress) // response address
    .storeUint(0, 1) // null custom payload
    .storeCoins(toNano("0.01")) // forward TON amount (for notification)
    .storeUint(0, 1) // null forward payload
    .endCell();

  return {
    validUntil: Math.floor(Date.now() / 1000) + 300, // valid for 5 minutes
    messages: [
      {
        address: jetton.walletAddress.address.toString(), // use toString() instead of toRawString()
        amount: toNano("0.05").toString(), // gas fee
        payload: body.toBoc().toString("base64"),
      },
    ],
  };
};