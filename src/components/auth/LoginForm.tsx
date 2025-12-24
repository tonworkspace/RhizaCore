// import React, { useState } from 'react';
// import { Mail, Shield, ArrowRight } from 'lucide-react';
// import { useWalletAuth } from '@/contexts/AuthContext';

// const LoginForm: React.FC = () => {
//   const [step, setStep] = useState<'email' | 'code'>('email');
//   const [email, setEmail] = useState('');
//   const [code, setCode] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');

//   const { sendCode, login } = useWalletAuth();

//   const handleSendCode = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!email) return;

//     setIsLoading(true);
//     setError('');

//     try {
//       await sendCode(email);
//       setStep('code');
//     } catch (error) {
//       setError('Failed to send verification code. Please try again.');
//       console.error('Send code error:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleVerifyCode = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!code) return;

//     setIsLoading(true);
//     setError('');

//     try {
//       await login(email, code);
//     } catch (error: unknown) {
//       console.error('Verify code error:', error);
      
//       // Provide more specific error messages
//       const errorMessage = error instanceof Error ? error.message : String(error);
//       if (errorMessage.includes('404')) {
//         setError('Invalid verification code. Please check and try again.');
//       } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
//         setError('Authentication failed. Please check your client ID configuration.');
//       } else if (errorMessage.includes('429')) {
//         setError('Too many attempts. Please wait a moment and try again.');
//       } else if (errorMessage.includes('Client ID')) {
//         setError('App configuration error. Please contact support.');
//       } else {
//         setError(errorMessage || 'Invalid verification code. Please try again.');
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleBack = () => {
//     setStep('email');
//     setCode('');
//     setError('');
//   };

//   return (
//     <div className="flex items-center justify-center p-4">
//       {/* Background particles effect to match ArcadeMiningUI */}
//       <div className="fixed inset-0 -z-10">
//         <div className="absolute inset-0 bg-gradient-to-br from-green-900/5 via-black to-green-900/5"></div>
//         <div className="absolute inset-0 opacity-10">
//           {[...Array(50)].map((_, i) => (
//             <div
//               key={i}
//               className="absolute w-1 h-1 bg-green-500/20 rounded-full animate-pulse"
//               style={{
//                 top: `${Math.random() * 100}%`,
//                 left: `${Math.random() * 100}%`,
//                 animationDelay: `${Math.random() * 5}s`,
//                 animationDuration: `${2 + Math.random() * 3}s`
//               }}
//             ></div>
//           ))}
//         </div>
//       </div>
//       <div className="w-full max-w-md">
//         {/* Logo and Header */}
//         <div className="text-center mb-8">
//           <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
//             <img src='https://rhizacore.xyz/shield.png' />
//           </div>
//           <h1 className="text-3xl font-bold text-green-400 mb-2">RhizaCore Wallet</h1>
//           <p className="text-green-300">Send and receive stablecoins with ease</p>
//         </div>

//         {/* Login Form */}
//         <div className="relative overflow-hidden rounded-2xl font-mono
//                         bg-gradient-to-br from-black via-[#0a0a0f] to-black
//                         border border-green-500/20
//                         shadow-[0_0_30px_rgba(34,197,94,0.1)]
//                         backdrop-blur-sm
//                         p-6">
//           {/* Corner accents */}
//           <div className="pointer-events-none absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-green-500/40 rounded-tl-lg shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
//           <div className="pointer-events-none absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-green-500/40 rounded-tr-lg shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
//           <div className="pointer-events-none absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-green-500/40 rounded-bl-lg shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
//           <div className="pointer-events-none absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-green-500/40 rounded-br-lg shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
//           {step === 'email' ? (
//             <form onSubmit={handleSendCode} className="space-y-6">
//               <div>
//                 <h2 className="text-xl font-semibold text-green-300 mb-2">
//                   Welcome back
//                 </h2>
//                 <p className="text-green-400/80 text-sm mb-6">
//                   Enter your email to get started
//                 </p>
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <label htmlFor="email" className="block text-sm font-medium text-green-300 mb-2">
//                     Email address
//                   </label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                       <Mail className="h-5 w-5 text-green-400" />
//                     </div>
//                     <input
//                       id="email"
//                       type="email"
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                       placeholder="you@example.com"
//                       className="w-full px-4 py-3 bg-gray-900/50 border border-green-500/20 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-white pl-10"
//                       required
//                       disabled={isLoading}
//                     />
//                   </div>
//                 </div>

//                 {error && (
//                   <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
//                     <p className="text-red-400 text-sm">{error}</p>
//                   </div>
//                 )}

//                 <button
//                   type="submit"
//                   disabled={isLoading || !email}
//                   className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] focus:outline-none focus:ring-4 focus:ring-green-500/30 shadow-lg w-full flex items-center justify-center"
//                 >
//                   {isLoading ? (
//                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                   ) : (
//                     <>
//                       Send Code
//                       <ArrowRight className="ml-2 h-4 w-4" />
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           ) : (
//             <form onSubmit={handleVerifyCode} className="space-y-6">
//               <div>
//                 <h2 className="text-xl font-semibold text-green-300 mb-2">
//                   Enter verification code
//                 </h2>
//                 <p className="text-green-400/80 text-sm mb-6">
//                   We sent a 6-digit code to <span className="font-medium text-green-300">{email}</span>
//                 </p>
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <label htmlFor="code" className="block text-sm font-medium text-green-300 mb-2">
//                     Verification code
//                   </label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                       <Shield className="h-5 w-5 text-green-400" />
//                     </div>
//                     <input
//                       id="code"
//                       type="text"
//                       value={code}
//                       onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
//                       placeholder="123456"
//                       className="w-full px-4 py-3 bg-gray-900/50 border border-green-500/20 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-white pl-10 text-center tracking-widest"
//                       maxLength={6}
//                       required
//                       disabled={isLoading}
//                     />
//                   </div>
//                 </div>

//                 {error && (
//                   <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
//                     <p className="text-red-400 text-sm">{error}</p>
//                   </div>
//                 )}

//                 <div className="space-y-3">
//                   <button
//                     type="submit"
//                     disabled={isLoading || code.length !== 6}
//                     className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] focus:outline-none focus:ring-4 focus:ring-green-500/30 shadow-lg w-full flex items-center justify-center"
//                   >
//                     {isLoading ? (
//                       <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                     ) : (
//                       <>
//                         Verify & Continue
//                         <ArrowRight className="ml-2 h-4 w-4" />
//                       </>
//                     )}
//                   </button>

//                   <button
//                     type="button"
//                     onClick={handleBack}
//                     className="w-full py-3 px-4 border border-green-500/30 rounded-xl text-green-300 font-medium hover:bg-green-500/10 transition-colors"
//                     disabled={isLoading}
//                   >
//                     Back to email
//                   </button>
//                 </div>
//               </div>
//             </form>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="text-center mt-8">
//           <p className="text-green-400/60 text-sm">
//             Powered by{' '}
//             <a href="https://rhizacore.xyz" className="text-green-300 hover:underline">
//               RhizaCore AI
//             </a>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginForm;
