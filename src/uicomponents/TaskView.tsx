// import React, { useState } from 'react';
// import { Task } from '../types';
// import { Icons } from './Icons';

// interface TaskViewProps {
//   onClaimReward: (amount: number) => void;
// }

// const INITIAL_TASKS: Task[] = [
//   { id: '1', title: 'Join RhizaCore Community', reward: 5000, icon: 'Telegram', category: 'social', status: 'pending', link: '#' },
//   { id: '2', title: 'Follow on X', reward: 2500, icon: 'Twitter', category: 'social', status: 'pending', link: '#' },
//   { id: '3', title: 'Subscribe to YouTube', reward: 2500, icon: 'Youtube', category: 'social', status: 'pending', link: '#' },
//   { id: '4', title: 'Invite 3 Friends', reward: 15000, icon: 'Users', category: 'social', status: 'pending', link: '#' },
//   { id: '5', title: 'Play "Cyber Drift"', reward: 10000, icon: 'Game', category: 'partner', status: 'pending', link: '#' },
// ];

// export const TaskView: React.FC<TaskViewProps> = ({ onClaimReward }) => {
//   const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
//   const [dailyDay, setDailyDay] = useState(3); // Mocking day 3
//   const [claimingId, setClaimingId] = useState<string | null>(null);

//   const handleTaskAction = (task: Task) => {
//     if (task.status === 'completed') return;

//     if (task.status === 'pending') {
//       // Open link logic would go here
//       // Mocking the "verification" process
//       const updatedTasks = tasks.map(t => 
//         t.id === task.id ? { ...t, status: 'ready_to_claim' as const } : t
//       );
//       setTasks(updatedTasks);
//     } else if (task.status === 'ready_to_claim') {
//       setClaimingId(task.id);
      
//       // Simulate API call
//       setTimeout(() => {
//         onClaimReward(task.reward);
//         const updatedTasks = tasks.map(t => 
//           t.id === task.id ? { ...t, status: 'completed' as const } : t
//         );
//         setTasks(updatedTasks);
//         setClaimingId(null);
//       }, 1000);
//     }
//   };

//   const DailyCheckIn = () => {
//     const rewards = [500, 1000, 2500, 5000, 10000, 25000, 100000];
    
//     return (
//       <div className="mb-8">
//         <div className="flex justify-between items-center mb-3">
//             <h2 className="text-white font-bold text-sm flex items-center gap-2">
//                 <Icons.Calendar size={16} className="text-rzc-green" />
//                 Daily Login
//             </h2>
//             <span className="text-gray-500 text-[10px] font-mono">Resets in 12:45:00</span>
//         </div>
        
//         <div className="flex justify-between gap-1 overflow-x-auto pb-2 scrollbar-hide">
//             {rewards.map((amount, index) => {
//                 const day = index + 1;
//                 const isCompleted = day < dailyDay;
//                 const isToday = day === dailyDay;
//                 const isFuture = day > dailyDay;

//                 return (
//                     <div 
//                         key={day}
//                         className={`
//                             min-w-[44px] h-16 rounded-xl flex flex-col items-center justify-center border transition-all relative overflow-hidden
//                             ${isCompleted ? 'bg-rzc-green/20 border-rzc-green/50' : ''}
//                             ${isToday ? 'bg-rzc-green text-black border-rzc-green shadow-[0_0_15px_rgba(74,222,128,0.3)]' : ''}
//                             ${isFuture ? 'bg-rzc-dark border-white/5 opacity-60' : ''}
//                         `}
//                     >
//                          {isCompleted && (
//                              <div className="absolute inset-0 flex items-center justify-center bg-rzc-black/50">
//                                  <Icons.Check size={20} className="text-rzc-green" />
//                              </div>
//                          )}
//                          <span className={`text-[9px] font-bold mb-1 ${isToday ? 'text-black' : 'text-gray-400'}`}>Day {day}</span>
//                          <span className={`text-[10px] font-mono font-bold ${isToday ? 'text-black' : 'text-white'}`}>
//                              {amount >= 1000 ? `${amount/1000}K` : amount}
//                          </span>
//                     </div>
//                 )
//             })}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="flex flex-col h-full w-full px-4 pt-4 pb-24 overflow-y-auto custom-scrollbar">
//       <h1 className="text-xl font-bold text-white tracking-wider mb-2">Missions</h1>
//       <p className="text-gray-400 text-xs mb-6">Complete tasks to upgrade your node's hashing power.</p>

//       <DailyCheckIn />

//       <h2 className="text-white font-bold text-sm mb-3">Active Tasks</h2>
//       <div className="space-y-3">
//         {tasks.map((task) => {
//             const Icon = Icons[task.icon] || Icons.Mining;
//             const isCompleted = task.status === 'completed';
//             const isClaiming = claimingId === task.id;
//             const isReady = task.status === 'ready_to_claim';

//             return (
//                 <div 
//                     key={task.id} 
//                     className={`
//                         flex items-center justify-between p-3 rounded-2xl border transition-all
//                         ${isCompleted ? 'bg-rzc-dark/50 border-white/5 opacity-50' : 'bg-rzc-dark border-white/10 hover:border-rzc-green/30'}
//                         ${isReady ? 'border-rzc-green/50 bg-rzc-green/5' : ''}
//                     `}
//                 >
//                     <div className="flex items-center gap-3">
//                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isReady ? 'bg-rzc-green/20 text-rzc-green' : 'bg-white/5 text-white'}`}>
//                             {isCompleted ? <Icons.Check size={20} /> : <Icon size={20} />}
//                         </div>
//                         <div className="flex flex-col">
//                             <span className="text-white text-xs font-bold">{task.title}</span>
//                             <div className="flex items-center gap-1 mt-0.5">
//                                 <span className="text-rzc-green font-mono text-xs font-bold">+{task.reward.toLocaleString()} RZC</span>
//                             </div>
//                         </div>
//                     </div>

//                     <button
//                         onClick={() => handleTaskAction(task)}
//                         disabled={isCompleted || isClaiming}
//                         className={`
//                             px-4 py-2 rounded-xl text-xs font-bold transition-all min-w-[80px] flex items-center justify-center
//                             ${isCompleted 
//                                 ? 'bg-transparent text-gray-500 cursor-default' 
//                                 : isReady
//                                     ? 'bg-rzc-green text-black hover:bg-rzc-green-dim shadow-[0_0_10px_rgba(74,222,128,0.2)]'
//                                     : 'bg-white/10 text-white hover:bg-white/20'
//                             }
//                         `}
//                     >
//                         {isClaiming ? (
//                             <Icons.Settings className="animate-spin" size={14} />
//                         ) : isCompleted ? (
//                             'Done'
//                         ) : isReady ? (
//                             'Claim'
//                         ) : (
//                             'Start'
//                         )}
//                     </button>
//                 </div>
//             );
//         })}
//       </div>
//     </div>
//   );
// };