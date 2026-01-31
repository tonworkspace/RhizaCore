// import React, { useState, useEffect } from 'react';
// import { MiningState } from '../types';
// import { Icons } from '@/uicomponents/Icons';
// import { AuthUser } from '@/hooks/useAuth';
// import { supabase } from '@/lib/supabaseClient';

// interface MiningData {
//   isMining: boolean;
//   currentSession: any | null;
//   sessionCountdown: string;
//   accumulatedRZC: number;
//   claimableRZC: number;
//   claimedRZC: number;
//   totalEarnedRZC: number;
//   sessionDurationHours: number | null;
//   canStartMining: boolean;
//   miningRateMultiplier: number;
//   userUpgrades: {
//     miningRigMk2: boolean;
//     extendedSession: boolean;
//     passiveIncomeBoostLevel: number;
//   };
// }

// interface AirdropViewProps {
//   state: MiningState;
//   onClaimAirdrop: (liquid: number, locked: number) => void;
//   user?: AuthUser | null;
//   showSnackbar?: (config: { message: string; description?: string }) => void;
//   miningData?: MiningData;
// }

// type AirdropStep = 'briefing' | 'audit' | 'matrix' | 'form' | 'sign' | 'complete';
// type Status = 'idle' | 'processing' | 'success' | 'error';

// interface AirdropClaim {
//   id?: number;
//   user_id: number;
//   total_amount: number;
//   liquid_amount: number;
//   locked_amount: number;
//   status: 'pending' | 'processing' | 'completed' | 'failed';
//   claim_timestamp: string;
//   validation_end_time?: string;
//   node_alias?: string;
//   destination_address?: string;
//   created_at: string;
//   updated_at?: string;
// }

// export const AirdropView: React.FC<AirdropViewProps> = ({ 
//   state, 
//   onClaimAirdrop, 
//   user, 
//   showSnackbar,
//   miningData 
// }) => {
//   const [isWizardOpen, setIsWizardOpen] = useState(false);
//   const [wizardStep, setWizardStep] = useState<AirdropStep>('briefing');
//   const [status, setStatus] = useState<Status>('idle');
//   const [txLogs, setTxLogs] = useState<string[]>([]);
//   const [currentLogIndex, setCurrentLogIndex] = useState(-1);
//   const [formData, setFormData] = useState({ 
//     username: user?.username || '', 
//     address: user?.wallet_address || user?.whitelisted_wallet || user?.payout_wallet || ''
//   });
//   const [countdown, setCountdown] = useState("01h 59m 59s");
//   const [airdropClaim, setAirdropClaim] = useState<AirdropClaim | null>(null);
//   const [isLoadingClaim, setIsLoadingClaim] = useState(true);

//   // Calculate airdrop amounts based on user's actual data and mining data
//   const miningBalance = miningData ? (miningData.claimableRZC + miningData.claimedRZC + (miningData.isMining ? miningData.accumulatedRZC : 0)) : 0;
//   const totalPool = user?.total_earned || miningBalance || state.miningBalance || 0;
//   const liquidClaimable = totalPool * 0.3;
//   const lockedPool = totalPool * 0.7;

//   // Load existing airdrop claim on component mount
//   useEffect(() => {
//     const loadAirdropClaim = async () => {
//       if (!user?.id) {
//         setIsLoadingClaim(false);
//         return;
//       }

//       try {
//         const { data, error } = await supabase
//           .from('airdrop_claims')
//           .select('*')
//           .eq('user_id', user.id)
//           .order('created_at', { ascending: false })
//           .limit(1)
//           .maybeSingle();

//         if (error && error.code !== 'PGRST116') {
//           console.error('Error loading airdrop claim:', error);
//         } else if (data) {
//           setAirdropClaim(data);
//         }
//       } catch (error) {
//         console.error('Error loading airdrop claim:', error);
//       } finally {
//         setIsLoadingClaim(false);
//       }
//     };

//     loadAirdropClaim();
//   }, [user?.id]);

//   // Update form data when user data changes
//   useEffect(() => {
//     if (user) {
//       setFormData({
//         username: user.username || `${user.first_name || 'User'}_${user.telegram_id}`,
//         address: user.wallet_address || user.whitelisted_wallet || user.payout_wallet || ''
//       });
//     }
//   }, [user]);

//   // Real-time validation countdown
//   useEffect(() => {
//     if (airdropClaim?.status === 'pending' && airdropClaim.validation_end_time) {
//       const interval = setInterval(() => {
//         const now = Date.now();
//         const endTime = new Date(airdropClaim.validation_end_time!).getTime();
//         const remaining = endTime - now;
        
//         if (remaining <= 0) {
//           setCountdown("00h 00m 00s");
//           // Check if claim status should be updated
//           checkClaimStatus();
//         } else {
//           const h = Math.floor(remaining / 3600000);
//           const m = Math.floor((remaining % 3600000) / 60000);
//           const s = Math.floor((remaining % 60000) / 1000);
//           setCountdown(`${h.toString().padStart(2,'0')}h ${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`);
//         }
//       }, 1000);
      
//       return () => clearInterval(interval);
//     }
//   }, [airdropClaim?.status, airdropClaim?.validation_end_time]);

//   const checkClaimStatus = async () => {
//     if (!airdropClaim?.id) return;

//     try {
//       const { data, error } = await supabase
//         .from('airdrop_claims')
//         .select('*')
//         .eq('id', airdropClaim.id)
//         .single();

//       if (!error && data) {
//         setAirdropClaim(data);
//       }
//     } catch (error) {
//       console.error('Error checking claim status:', error);
//     }
//   };

//   const resetWizard = () => {
//     setIsWizardOpen(false);
//     setWizardStep('briefing');
//     setStatus('idle');
//     setTxLogs([]);
//     setCurrentLogIndex(-1);
//   };

//   const createAirdropClaim = async () => {
//     if (!user?.id) return null;

//     try {
//       const claimData: Partial<AirdropClaim> = {
//         user_id: user.id,
//         total_amount: totalPool,
//         liquid_amount: liquidClaimable,
//         locked_amount: lockedPool,
//         status: 'pending',
//         claim_timestamp: new Date().toISOString(),
//         validation_end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
//         node_alias: formData.username,
//         destination_address: formData.address,
//         created_at: new Date().toISOString()
//       };

//       const { data, error } = await supabase
//         .from('airdrop_claims')
//         .insert([claimData])
//         .select()
//         .single();

//       if (error) throw error;

//       // Create activity record
//       await supabase.from('activities').insert({
//         user_id: user.id,
//         type: 'airdrop_claim',
//         amount: totalPool,
//         status: 'pending',
//         metadata: {
//           liquid_amount: liquidClaimable,
//           locked_amount: lockedPool,
//           claim_id: data.id
//         },
//         created_at: new Date().toISOString()
//       });

//       return data;
//     } catch (error) {
//       console.error('Error creating airdrop claim:', error);
//       showSnackbar?.({
//         message: 'Claim Failed',
//         description: 'Failed to create airdrop claim. Please try again.'
//       });
//       return null;
//     }
//   };

//   const handleNext = async () => {
//     try {
//       if (wizardStep === 'briefing') {
//         setWizardStep('audit');
//       } else if (wizardStep === 'audit') {
//         setStatus('processing');
//         const logs = [
//           `SCANNING_USER_${user?.telegram_id}_FINGERPRINT`,
//           "HARDWARE_ATTESTATION_PASS", 
//           `NODE_UPTIME_${Math.floor(Math.random() * 100)}%_VERIFIED`, 
//           "GENESIS_ELIGIBILITY_CONFIRMED"
//         ];
//         setTxLogs(logs);
        
//         for (let i = 0; i < logs.length; i++) {
//           await new Promise(r => setTimeout(r, 700));
//           setCurrentLogIndex(i);
//         }
        
//         setStatus('idle');
//         setWizardStep('matrix');
//       } else if (wizardStep === 'matrix') {
//         setWizardStep('form');
//       } else if (wizardStep === 'form') {
//         setWizardStep('sign');
//       } else if (wizardStep === 'sign') {
//         setStatus('processing');
//         const logs = [
//           `GENERATING_EDDSA_SIGNATURE_${user?.id}`,
//           "BROADCASTING_TO_P2P_NETWORK", 
//           "MEMPOOL_INGRESS_OK", 
//           "HANDOVER_TO_VALIDATION_QUEUE"
//         ];
//         setTxLogs(logs);
        
//         for (let i = 0; i < logs.length; i++) {
//           await new Promise(r => setTimeout(r, 600));
//           setCurrentLogIndex(i);
//         }
        
//         // Create the actual airdrop claim in database
//         const newClaim = await createAirdropClaim();
//         if (newClaim) {
//           setAirdropClaim(newClaim);
//           onClaimAirdrop(liquidClaimable, lockedPool);
//           showSnackbar?.({
//             message: 'Claim Submitted!',
//             description: `${liquidClaimable.toFixed(2)} RZC liquid + ${lockedPool.toFixed(2)} RZC locked`
//           });
//         }
        
//         setStatus('success');
//         setWizardStep('complete');
//       }
//     } catch (err) {
//       console.error('Error in wizard step:', err);
//       setStatus('error');
//       showSnackbar?.({
//         message: 'Process Failed',
//         description: 'An error occurred during the claim process.'
//       });
//     }
//   };

//   const isFormValid = formData.username.length > 2 && formData.address.length > 10;

//   if (isLoadingClaim) {
//     return (
//       <div className="flex flex-col h-full w-full bg-rzc-black p-6 items-center justify-center text-center">
//         <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
//         <p className="text-gray-500 text-sm">Loading airdrop status...</p>
//       </div>
//     );
//   }

//   // --- VIEW: PENDING VALIDATION ---
//   if (airdropClaim?.status === 'pending') {
//     return (
//       <div className="flex flex-col h-full w-full bg-rzc-black p-6 items-center justify-center text-center">
//         <div className="w-24 h-24 bg-blue-500/10 border border-blue-500/30 rounded-[2rem] flex items-center justify-center text-blue-400 mb-8 animate-pulse shadow-[0_0_40px_rgba(59,130,246,0.1)]">
//           <Icons.Refresh size={48} className="animate-spin" />
//         </div>
        
//         <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Security Audit Active</h2>
//         <p className="text-gray-500 text-xs leading-relaxed mb-4 max-w-xs">
//           Your genesis claim is undergoing distributed node verification. This automated process ensures zero-knowledge proof of contribution.
//         </p>
        
//         <div className="bg-white/5 rounded-2xl p-4 mb-6 w-full max-w-xs">
//           <div className="text-[10px] text-gray-500 mb-1">Claim ID</div>
//           <div className="text-sm font-mono text-white">#{airdropClaim.id}</div>
//         </div>
        
//         <div className="bg-rzc-dark border border-white/5 rounded-[2.5rem] p-8 w-full mb-8 relative overflow-hidden group">
//           <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/10">
//             <div className="h-full bg-blue-500 animate-pulse" style={{width: '65%'}}></div>
//           </div>
//           <span className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.3em] block mb-4 font-mono opacity-60">
//             VALIDATION_TIME_REMAINING
//           </span>
//           <span className="text-4xl font-mono font-bold text-white tracking-tighter">
//             {countdown}
//           </span>
//         </div>
        
//         <div className="space-y-2 mb-6 w-full max-w-xs">
//           <div className="flex justify-between text-xs">
//             <span className="text-gray-500">Total Pool:</span>
//             <span className="text-white font-mono">{airdropClaim.total_amount.toFixed(2)} RZC</span>
//           </div>
//           <div className="flex justify-between text-xs">
//             <span className="text-gray-500">Liquid (30%):</span>
//             <span className="text-rzc-green font-mono">{airdropClaim.liquid_amount.toFixed(2)} RZC</span>
//           </div>
//           <div className="flex justify-between text-xs">
//             <span className="text-gray-500">Locked (70%):</span>
//             <span className="text-blue-400 font-mono">{airdropClaim.locked_amount.toFixed(2)} RZC</span>
//           </div>
//         </div>
        
//         <div className="flex items-center gap-2 text-gray-700 font-mono text-[9px] bg-white/5 px-4 py-2 rounded-full border border-white/5">
//           <Icons.Lock size={12} className="text-blue-500" /> SYSTEM_ENCRYPTION_STABLE
//         </div>
//       </div>
//     );
//   }

//   // --- VIEW: CLAIMED SUCCESS ---
//   if (airdropClaim?.status === 'completed') {
//     return (
//       <div className="flex flex-col h-full w-full bg-rzc-black overflow-y-auto custom-scrollbar p-6">
//         <div className="bg-gradient-to-br from-rzc-green/10 to-rzc-dark border border-rzc-green/30 rounded-[2.5rem] p-10 text-center animate-in zoom-in duration-700 shadow-2xl">
//           <div className="w-24 h-24 bg-rzc-green/20 rounded-full flex items-center justify-center mx-auto mb-8 text-rzc-green shadow-[0_0_50px_rgba(74,222,128,0.2)]">
//             <Icons.Check size={48} strokeWidth={3} />
//           </div>
          
//           <h2 className="text-3xl font-bold text-white mb-4 tracking-tighter">Claim Verified</h2>
//           <p className="text-gray-400 text-xs leading-relaxed mb-6 px-4">
//             The verification phase has concluded. Your assets have been split: 30% available in main balance, 70% secured in the release vault.
//           </p>

//           <div className="bg-white/5 rounded-2xl p-4 mb-6">
//             <div className="text-[10px] text-gray-500 mb-1">Claim ID</div>
//             <div className="text-sm font-mono text-white">#{airdropClaim.id}</div>
//           </div>
          
//           <div className="space-y-3 mb-10">
//             <div className="bg-black/60 border border-white/5 rounded-2xl p-5 flex justify-between items-center group hover:border-rzc-green/20 transition-all">
//               <div className="text-left">
//                 <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Liquid Claimed</span>
//                 <span className="text-sm font-bold text-rzc-green">{airdropClaim.liquid_amount.toFixed(2)} RZC</span>
//               </div>
//               <Icons.Globe size={20} className="text-gray-800 group-hover:text-rzc-green transition-colors" />
//             </div>
//             <div className="bg-black/60 border border-white/5 rounded-2xl p-5 flex justify-between items-center">
//               <div className="text-left">
//                 <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Vault Locked</span>
//                 <span className="text-sm font-bold text-blue-400">{airdropClaim.locked_amount.toFixed(2)} RZC</span>
//               </div>
//               <Icons.Lock size={20} className="text-gray-800" />
//             </div>
//           </div>
          
//           <p className="text-gray-500 text-[10px] font-mono leading-tight bg-black/40 py-4 px-6 rounded-2xl border border-white/5">
//             Visit the <span className="text-white font-bold">Mining</span> tab to view your updated balance and continue earning.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // --- VIEW: INITIAL BRIEFING ---
//   return (
//     <div className="flex flex-col h-full w-full bg-rzc-black overflow-y-auto custom-scrollbar relative pb-32">
//       <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/10 blur-[120px] pointer-events-none"></div>
      
//       <div className="flex-1 flex flex-col px-6 pt-12 items-center text-center relative z-10">
//         <div className="w-20 h-20 bg-gradient-to-tr from-blue-700 to-blue-400 rounded-3xl flex items-center justify-center text-white shadow-2xl mb-10 rotate-6 hover:rotate-0 transition-transform duration-500">
//           <Icons.Rank size={40} />
//         </div>
        
//         <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tighter">Genesis Event</h1>
//         <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-[280px]">
//           The first era of RhizaCore mining has concluded. Initial distributions are now being dispatched.
//         </p>

//         {/* User Info Card with Mining Status */}
//         {user && (
//           <div className="w-full bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
//             <div className="flex items-center gap-3 mb-3">
//               <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
//                 <span className="text-blue-400 font-bold text-sm">
//                   {user.username?.charAt(0).toUpperCase() || user.first_name?.charAt(0).toUpperCase() || 'U'}
//                 </span>
//               </div>
//               <div className="text-left">
//                 <div className="text-white font-bold text-sm">
//                   {user.username || `${user.first_name} ${user.last_name}`.trim() || 'User'}
//                 </div>
//                 <div className="text-gray-500 text-xs">ID: {user.telegram_id}</div>
//               </div>
//               {miningData?.isMining && (
//                 <div className="ml-auto">
//                   <div className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
//                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//                     <span className="text-green-400 text-xs font-mono">MINING</span>
//                   </div>
//                 </div>
//               )}
//             </div>
//             <div className="grid grid-cols-2 gap-3 text-xs">
//               <div>
//                 <span className="text-gray-500">Rank:</span>
//                 <span className="text-white ml-1 font-mono">{user.rank || 'Novice'}</span>
//               </div>
//               <div>
//                 <span className="text-gray-500">Earned:</span>
//                 <span className="text-rzc-green ml-1 font-mono">{(user.total_earned || miningBalance || 0).toFixed(2)} RZC</span>
//               </div>
//               {miningData && (
//                 <>
//                   <div>
//                     <span className="text-gray-500">Mining:</span>
//                     <span className="text-blue-400 ml-1 font-mono">{miningData.accumulatedRZC.toFixed(4)} RZC</span>
//                   </div>
//                   <div>
//                     <span className="text-gray-500">Session:</span>
//                     <span className="text-white ml-1 font-mono">{miningData.sessionCountdown}</span>
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Informational Cards */}
//         <div className="w-full space-y-4 mb-10">
//           <div className="p-5 bg-white/5 border border-white/10 rounded-2xl text-left group hover:bg-white/10 transition-colors">
//             <div className="flex items-center gap-3 mb-2">
//               <Icons.Refresh size={16} className="text-blue-400" />
//               <h4 className="text-white font-bold text-[11px] uppercase tracking-widest">Protocol Validation</h4>
//             </div>
//             <p className="text-gray-500 text-[10px] leading-relaxed">
//               Claims require a mandatory 1-2 hour node audit before assets are delivered to the mainnet ledger.
//             </p>
//           </div>
//           <div className="p-5 bg-white/5 border border-white/10 rounded-2xl text-left group hover:bg-white/10 transition-colors">
//             <div className="flex items-center gap-3 mb-2">
//               <Icons.Lock size={16} className="text-blue-400" />
//               <h4 className="text-white font-bold text-[11px] uppercase tracking-widest">30/70 Asset Split</h4>
//             </div>
//             <p className="text-gray-500 text-[10px] leading-relaxed">
//               30% immediate liquidity. 70% locked in a linear vault to ensure long-term network stability.
//             </p>
//           </div>
//           {miningData && (
//             <div className="p-5 bg-green-500/5 border border-green-500/20 rounded-2xl text-left group hover:bg-green-500/10 transition-colors">
//               <div className="flex items-center gap-3 mb-2">
//                 <Icons.Energy size={16} className="text-green-400" />
//                 <h4 className="text-white font-bold text-[11px] uppercase tracking-widest">Live Mining Status</h4>
//               </div>
//               <p className="text-gray-500 text-[10px] leading-relaxed">
//                 {miningData.isMining 
//                   ? `Currently mining: ${miningData.accumulatedRZC.toFixed(4)} RZC accumulated. Session ends in ${miningData.sessionCountdown}.`
//                   : miningData.canStartMining 
//                     ? 'Mining system ready. Start a new session to earn RZC rewards.'
//                     : 'Mining system offline. Check your node status.'
//                 }
//               </p>
//               {miningData.userUpgrades.miningRigMk2 && (
//                 <div className="mt-2 flex items-center gap-2">
//                   <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
//                   <span className="text-yellow-400 text-[9px] font-bold">MK2 RIG ACTIVE (+25% RATE)</span>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         <div className="w-full bg-rzc-dark border border-white/5 rounded-3xl p-6 flex items-center justify-between mb-10 shadow-inner">
//           <div className="text-left">
//             <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1">Available Pool</span>
//             <span className="text-2xl font-mono font-bold text-white">{totalPool.toLocaleString()} RZC</span>
//           </div>
//           <Icons.Chip size={32} className="text-gray-800" />
//         </div>

//         <button 
//           onClick={() => setIsWizardOpen(true)}
//           disabled={totalPool <= 0}
//           className={`w-full py-5 rounded-3xl font-bold uppercase text-[12px] tracking-[0.25em] shadow-[0_15px_30px_rgba(37,99,235,0.3)] active:scale-95 transition-all ${
//             totalPool > 0 
//               ? 'bg-blue-600 text-white hover:bg-blue-700' 
//               : 'bg-gray-600 text-gray-400 cursor-not-allowed'
//           }`}
//         >
//           {totalPool > 0 ? 'INITIATE DISPATCH' : 'NO EARNINGS TO CLAIM'}
//         </button>
//       </div>

//       {/* --- WIZARD MODAL --- */}
//       {isWizardOpen && (
//         <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
//           <div 
//             className="absolute inset-0 bg-black/98 backdrop-blur-2xl" 
//             onClick={() => status !== 'processing' && resetWizard()}
//           ></div>
          
//           <div className="w-full max-w-sm bg-rzc-dark border border-white/10 rounded-[3rem] p-10 relative z-10 overflow-hidden shadow-2xl">
//             <div className="flex items-center gap-3 mb-8">
//               <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
//                 <Icons.Rank size={16} />
//               </div>
//               <h2 className="text-white font-bold text-xs uppercase tracking-[0.2em]">Genesis Wizard</h2>
//             </div>

//             {status === 'processing' ? (
//               <div className="flex flex-col items-center py-8">
//                 <div className="w-14 h-14 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-8"></div>
//                 <div className="w-full bg-black/50 rounded-2xl p-5 font-mono text-[9px] min-h-[120px] border border-white/5 shadow-inner">
//                   {txLogs.map((log, i) => (
//                     <div key={i} className={`mb-1.5 transition-all duration-300 ${i <= currentLogIndex ? 'text-blue-400 opacity-100' : 'text-gray-800 opacity-40'}`}>
//                       {i <= currentLogIndex ? '✔' : '○'} {log}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               <div className="space-y-8 animate-in fade-in duration-300">
//                 {wizardStep === 'briefing' && (
//                   <div>
//                     <h3 className="text-white font-bold text-xl mb-3 tracking-tight">Terms of Dispatch</h3>
//                     <p className="text-gray-500 text-xs leading-relaxed mb-10 italic border-l-2 border-blue-500 pl-4">
//                       By proceeding, you acknowledge that rewards are non-reversible and subject to a 1-2 hour validation cycle.
//                     </p>
//                     <button 
//                       onClick={handleNext} 
//                       className="w-full py-5 bg-white text-black rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-xl"
//                     >
//                       I Agree & Proceed
//                     </button>
//                   </div>
//                 )}

//                 {wizardStep === 'audit' && (
//                   <div>
//                     <h3 className="text-white font-bold text-xl mb-3">Integrity Check</h3>
//                     <p className="text-gray-500 text-xs leading-relaxed mb-10">
//                       System will now scan your node's contribution history to verify hashrate authenticity.
//                     </p>
//                     <button 
//                       onClick={handleNext} 
//                       className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-xl"
//                     >
//                       Run Node Audit
//                     </button>
//                   </div>
//                 )}

//                 {wizardStep === 'matrix' && (
//                   <div>
//                     <h3 className="text-white font-bold text-xl mb-6">Allocation Table</h3>
//                     <div className="space-y-4 mb-10">
//                       <div className="p-5 bg-rzc-green/5 border border-rzc-green/20 rounded-2xl flex justify-between items-center group">
//                         <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Liquid (30%)</span>
//                         <span className="text-rzc-green font-mono font-bold text-lg group-hover:scale-110 transition-transform">+{liquidClaimable.toFixed(0)}</span>
//                       </div>
//                       <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
//                         <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Vaulted (70%)</span>
//                         <span className="text-blue-400 font-mono font-bold text-lg">{lockedPool.toFixed(0)}</span>
//                       </div>
//                     </div>
//                     <button 
//                       onClick={handleNext} 
//                       className="w-full py-5 bg-white text-black rounded-2xl font-bold uppercase text-[11px] tracking-widest"
//                     >
//                       Confirm Split
//                     </button>
//                   </div>
//                 )}

//                 {wizardStep === 'form' && (
//                   <div>
//                     <h3 className="text-white font-bold text-xl mb-6 tracking-tight">Node Identity</h3>
//                     <div className="space-y-4 mb-10">
//                       <div className="space-y-1.5">
//                         <label className="text-[9px] text-gray-600 font-bold uppercase ml-1">Alias</label>
//                         <input 
//                           type="text" 
//                           placeholder="e.g. NeoNode_01" 
//                           className="w-full bg-black/60 border border-white/10 rounded-xl px-5 py-4 text-white text-xs font-mono outline-none focus:border-blue-500"
//                           value={formData.username}
//                           onChange={(e) => setFormData({...formData, username: e.target.value})}
//                         />
//                       </div>
//                       <div className="space-y-1.5">
//                         <label className="text-[9px] text-gray-600 font-bold uppercase ml-1">TON Destination</label>
//                         <input 
//                           type="text" 
//                           placeholder="UQA7...x9z2" 
//                           className="w-full bg-black/60 border border-white/10 rounded-xl px-5 py-4 text-white text-[10px] font-mono outline-none focus:border-blue-500"
//                           value={formData.address}
//                           onChange={(e) => setFormData({...formData, address: e.target.value})}
//                         />
//                       </div>
//                     </div>
//                     <button 
//                       onClick={handleNext} 
//                       disabled={!isFormValid}
//                       className={`w-full py-5 rounded-2xl font-bold uppercase text-[11px] tracking-widest transition-all ${
//                         isFormValid ? 'bg-blue-600 text-white shadow-xl' : 'bg-white/5 text-gray-700 cursor-not-allowed'
//                       }`}
//                     >
//                       Store Config
//                     </button>
//                   </div>
//                 )}

//                 {wizardStep === 'sign' && (
//                   <div className="text-center">
//                     <div className="w-20 h-20 bg-blue-600/10 border border-blue-600/30 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-500 animate-pulse">
//                       <Icons.Power size={32} />
//                     </div>
//                     <h3 className="text-white font-bold text-2xl mb-3 tracking-tighter">Authorize Dispatch</h3>
//                     <p className="text-gray-500 text-xs leading-relaxed mb-10 px-4">
//                       Broadcast your dispatch payload to the mainnet. Handover to validation nodes will be immediate.
//                     </p>
//                     <button 
//                       onClick={handleNext} 
//                       className="w-full py-5 bg-blue-600 text-white rounded-3xl font-bold uppercase text-[11px] tracking-[0.2em] shadow-2xl"
//                     >
//                       SIGN & BROADCAST
//                     </button>
//                   </div>
//                 )}

//                 {wizardStep === 'complete' && (
//                   <div className="text-center py-6 animate-in zoom-in">
//                     <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 text-black shadow-[0_0_40px_rgba(37,99,235,0.4)]">
//                       <Icons.History size={36} strokeWidth={2.5} />
//                     </div>
//                     <h3 className="text-white font-bold text-2xl mb-2 tracking-tighter">Queue Established</h3>
//                     <p className="text-gray-500 text-[10px] font-mono mb-10 tracking-widest">SYSTEM_HANDOFF_SUCCESSFUL</p>
//                     <button 
//                       onClick={resetWizard} 
//                       className="w-full py-5 bg-white/5 text-white rounded-3xl font-bold uppercase text-[11px] tracking-widest border border-white/10 hover:bg-white/10 transition-all"
//                     >
//                       View Audit Progress
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };