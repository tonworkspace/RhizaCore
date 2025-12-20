import React from 'react';
import {
  FaMagento,
  FaTasks,
  FaWallet,
  FaCube,
  FaEllipsisH,
  FaGlobe
} from 'react-icons/fa';

interface IconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const Icons = {
  Mining: (props: IconProps) => <FaMagento size={props.size} className={props.className} />,
  Task: (props: IconProps) => <FaTasks size={props.size} className={props.className} />,
  Wallet: (props: IconProps) => <FaWallet size={props.size} className={props.className} />,
  Core: (props: IconProps) => <FaCube size={props.size} className={props.className} />,
  More: (props: IconProps) => <FaEllipsisH size={props.size} className={props.className} />,
  Globe: (props: IconProps) => <FaGlobe size={props.size} className={props.className} />,
};