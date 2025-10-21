// import React, { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabaseClient';

// interface WithdrawalRequest {
//   id: string;
//   user_id: string;
//   amount: number;
//   wallet_address: string;
//   status: string;
//   created_at: string;
//   username?: string;
//   first_name?: string;
//   last_name?: string;
// }

// const AdminWithdrawalPanel: React.FC = () => {
//   const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [processingIds, setProcessingIds] = useState<string[]>([]);
//   const [users, setUsers] = useState<any[]>([]);
//   const [selectedUser, setSelectedUser] = useState<any>(null);
//   const [showUserModal, setShowUserModal] = useState(false);
//   const [userDeposits, setUserDeposits] = useState<any[]>([]);
//   const [loadingDeposits, setLoadingDeposits] = useState(false);
//   const [userReferrals, setUserReferrals] = useState<any[]>([]);
//   const [loadingReferrals, setLoadingReferrals] = useState(false);
//   const [userTasks, setUserTasks] = useState<any>({});
//   const [loadingTasks, setLoadingTasks] = useState(false);
//   const [totalUsers, setTotalUsers] = useState(0);
//   const [onlineUsers, setOnlineUsers] = useState<number>(0);

//   // Define the task structure based on SocialTasks component
//   const socialTasksList = [
//     {
//       id: 1,
//       platform: 'Telegram',
//       action: 'Join StakeNova Telegram Group',
//       reward: 0.5,
//       link: 'https://t.me/StakeNova_Community',
//       description: 'Join our vibrant community and stay updated!'
//     },
//     {
//       id: 2,
//       platform: 'Telegram',
//       action: 'Join StakeNova Telegram Channel',
//       reward: 0.5,
//       link: 'https://t.me/StakeNova_Channel',
//       description: 'Stay connected with the latest updates!'
//     },
//     {
//       id: 3,
//       platform: 'Twitter',
//       action: 'Follow StakeNova on X',
//       reward: 1,
//       link: 'https://x.com/StakeNova_web3',
//       description: 'Follow us on X for the latest news and updates!'
//     },
//     {
//       id: 4,
//       platform: 'Facebook',
//       action: 'Like StakeNova Facebook Page',
//       reward: 1,
//       link: 'https://www.facebook.com/stakenovacommunity',
//       description: 'Show your support by liking our Facebook page!'
//     },
//     {
//       id: 5,
//       platform: 'Medium',
//       action: 'Follow StakeNova Medium Blog',
//       reward: 3,
//       link: 'https://medium.com/@stakenova',
//       description: 'Stay informed with our Medium blog!'
//     },
//     {
//       id: 6,
//       platform: 'Youtube',
//       action: 'Subscribe to StakeNova Youtube Channel',
//       reward: 5,
//       link: 'https://www.youtube.com/@StakeNova_Community',
//       description: 'Subscribe to our YouTube channel for video content!'
//     }
//   ];

//   useEffect(() => {
//     fetchWithdrawalRequests();
//     fetchAllUsers();
//     fetchOnlineUsers();
    
//     // Refresh online users count every minute
//     const interval = setInterval(fetchOnlineUsers, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   const fetchAllUsers = async () => {
//     try {
//       // Get the total count of all users
//       const { count, error: countError } = await supabase
//         .from('users')
//         .select('*', { count: 'exact', head: true });
      
//       if (countError) throw countError;
//       setTotalUsers(count || 0);
      
//       // Get only users with balance > 0
//       const { data, error } = await supabase
//         .from('users')
//         .select('*')
//         .gt('balance', 0)  // Only users with balance greater than 0
//         .order('balance', { ascending: false });  // Order by balance, highest first

//       if (error) throw error;
//       setUsers(data || []);
//     } catch (error) {
//       console.error('Error fetching users:', error);
//     }
//   };

//   const fetchWithdrawalRequests = async () => {
//     setIsLoading(true);
//     try {
//       // Get all pending withdrawal requests with user information
//       const { data, error } = await supabase
//         .from('withdrawal_requests')
//         .select(`
//           *,
//           users:user_id (
//             username,
//             first_name,
//             last_name
//           )
//         `)
//         .eq('status', 'pending')
//         .order('created_at', { ascending: false });

//       if (error) throw error;

//       // Format the data to include user information
//       const formattedData = data.map((item: any) => ({
//         id: item.id,
//         user_id: item.user_id,
//         amount: item.amount,
//         wallet_address: item.wallet_address,
//         status: item.status,
//         created_at: item.created_at,
//         username: item.users?.username,
//         first_name: item.users?.first_name,
//         last_name: item.users?.last_name
//       }));

//       setWithdrawalRequests(formattedData);
//     } catch (error) {
//       console.error('Error fetching withdrawal requests:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleApproveWithdrawal = async (id: string) => {
//     setProcessingIds(prev => [...prev, id]);
//     try {
//       // Update the withdrawal request status
//       const { error: updateError } = await supabase
//         .from('withdrawal_requests')
//         .update({ status: 'completed' })
//         .eq('id', id);

//       if (updateError) throw updateError;

//       // Get the withdrawal request details
//       const { data: requestData, error: requestError } = await supabase
//         .from('withdrawal_requests')
//         .select('user_id, amount')
//         .eq('id', id)
//         .single();

//       if (requestError) throw requestError;

//       // Update the user's pending_withdrawal status
//       const { error: userUpdateError } = await supabase
//         .from('users')
//         .update({ 
//           pending_withdrawal: false,
//           total_withdrawn: 0, // Reset the total_withdrawn amount
//           last_withdrawal_date: new Date().toISOString()
//         })
//         .eq('id', requestData.user_id);

//       if (userUpdateError) throw userUpdateError;

//       // Add to activity log
//       const { error: activityError } = await supabase
//         .from('activities')
//         .insert({
//           user_id: requestData.user_id,
//           type: 'withdrawal',
//           amount: requestData.amount,
//           status: 'completed',
//           created_at: new Date().toISOString()
//         });

//       if (activityError) throw activityError;

//       // Refresh the list
//       fetchWithdrawalRequests();
//     } catch (error) {
//       console.error('Error approving withdrawal:', error);
//     } finally {
//       setProcessingIds(prev => prev.filter(item => item !== id));
//     }
//   };

//   const handleRejectWithdrawal = async (id: string) => {
//     setProcessingIds(prev => [...prev, id]);
//     try {
//       // Get the withdrawal request details
//       const { data: requestData, error: requestError } = await supabase
//         .from('withdrawal_requests')
//         .select('user_id, amount')
//         .eq('id', id)
//         .single();

//       if (requestError) throw requestError;

//       // Update the withdrawal request status
//       const { error: updateError } = await supabase
//         .from('withdrawal_requests')
//         .update({ status: 'rejected' })
//         .eq('id', id);

//       if (updateError) throw updateError;

//       // Update the user's pending_withdrawal status
//       const { error: userUpdateError } = await supabase
//         .from('users')
//         .update({ 
//           pending_withdrawal: false
//           // Keep the total_withdrawn amount so they can try again
//         })
//         .eq('id', requestData.user_id);

//       if (userUpdateError) throw userUpdateError;

//       // Add to activity log
//       const { error: activityError } = await supabase
//         .from('activities')
//         .insert({
//           user_id: requestData.user_id,
//           type: 'withdrawal_rejected',
//           amount: requestData.amount,
//           status: 'rejected',
//           created_at: new Date().toISOString()
//         });

//       if (activityError) throw activityError;

//       // Refresh the list
//       fetchWithdrawalRequests();
//     } catch (error) {
//       console.error('Error rejecting withdrawal:', error);
//     } finally {
//       setProcessingIds(prev => prev.filter(item => item !== id));
//     }
//   };

//   const handleViewUserDetails = async (user: any) => {
//     setSelectedUser(user);
//     setShowUserModal(true);
//     setLoadingDeposits(true);
//     setLoadingReferrals(true);
//     setLoadingTasks(true);
    
//     try {
//       // Fetch recent deposits for this user
//       const { data, error } = await supabase
//         .from('deposits')
//         .select('*')
//         .eq('user_id', user.id)
//         .order('created_at', { ascending: false })
//         .limit(5);
        
//       if (error) throw error;
//       setUserDeposits(data || []);
      
//       // Fetch current earnings data
//       const { data: earningsData, error: earningsError } = await supabase
//         .from('user_earnings')
//         .select('current_earnings, last_update')
//         .eq('user_id', user.id)
//         .single();
        
//       if (!earningsError && earningsData) {
//         // Update the selected user with current earnings info
//         setSelectedUser({
//           ...user,
//           current_earnings: earningsData.current_earnings || 0,
//           earnings_last_update: earningsData.last_update
//         });
//       }
      
//       // Fetch user's referrals from the referrals table
//       const { data: referralsData, error: referralsError } = await supabase
//         .from('referrals')
//         .select(`
//           *,
//           referred:users!referred_id(
//             id,
//             username,
//             first_name,
//             last_name,
//             created_at,
//             balance,
//             total_deposit,
//             total_earned,
//             is_premium
//           )
//         `)
//         .eq('referrer_id', user.id)
//         .order('created_at', { ascending: false });
        
//       if (referralsError) throw referralsError;
      
//       // Extract the referred users from the referrals data
//       const referredUsers = referralsData?.map(ref => ref.referred) || [];
//       setUserReferrals(referredUsers);
      
//       // Fetch user's completed social tasks
//       const { data: completedTasksData, error: completedTasksError } = await supabase
//         .from('completed_tasks')
//         .select('task_id')
//         .eq('user_id', user.id);
        
//       if (completedTasksError) throw completedTasksError;
      
//       // Create a map of completed tasks
//       const completedTaskIds = completedTasksData?.map(task => task.task_id) || [];
//       const tasksMap = socialTasksList.reduce((acc, task) => {
//         acc[task.id] = {
//           ...task,
//           isCompleted: completedTaskIds.includes(task.id)
//         };
//         return acc;
//       }, {} as Record<number, any>);
      
//       setUserTasks(tasksMap);
      
//     } catch (error) {
//       console.error('Error fetching user data:', error);
//     } finally {
//       setLoadingDeposits(false);
//       setLoadingReferrals(false);
//       setLoadingTasks(false);
//     }
//   };

//   const handleCloseUserModal = () => {
//     setShowUserModal(false);
//     setSelectedUser(null);
//   };

//   const fetchOnlineUsers = async () => {
//     try {
//       // Consider users active in the last 15 minutes as "online"
//       const fifteenMinutesAgo = new Date();
//       fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
      
//       const { count, error } = await supabase
//         .from('users')
//         .select('*', { count: 'exact', head: true })
//         .gt('last_active', fifteenMinutesAgo.toISOString());
      
//       if (error) throw error;
//       setOnlineUsers(count || 0);
//     } catch (error) {
//       console.error('Error fetching online users:', error);
//       setOnlineUsers(0);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-[#0A0A0F] text-white p-6 rounded-xl border border-white/10">
//       <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
//         <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//         </svg>
//         Admin Panel
//       </h2>

//       {/* User Stats Summary */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//         <div className="bg-white/5 p-4 rounded-lg border border-white/10">
//           <h5 className="text-sm text-white/60 mb-1">Total Users</h5>
//           <p className="text-2xl font-bold">{totalUsers}</p>
//         </div>
    
//         <div className="bg-white/5 p-4 rounded-lg border border-white/10">
//           <h5 className="text-sm text-white/60 mb-1">Total Online</h5>
//           <p className="text-2xl font-bold">{onlineUsers}</p>
//         </div>
//       </div>

//       {/* Always show users table (no conditional rendering based on tab) */}
//       <div className="overflow-x-auto">
//         <table className="w-full border-collapse">
//           <thead>
//             <tr className="bg-white/5 text-left">
//               <th className="px-4 py-3 text-sm font-medium text-white/60 rounded-tl-lg">User</th>
//               <th className="px-4 py-3 text-sm font-medium text-white/60">Balance</th>
//               <th className="px-4 py-3 text-sm font-medium text-white/60">Total Withdrawn</th>
//               <th className="px-4 py-3 text-sm font-medium text-white/60">Wallet</th>
//               <th className="px-4 py-3 text-sm font-medium text-white/60">Joined</th>
//               <th className="px-4 py-3 text-sm font-medium text-white/60 rounded-tr-lg">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-white/5">
//             {users.map((user) => (
//               <tr key={user.id} className="hover:bg-white/5">
//                 <td className="px-4 py-3">
//                   <div className="flex items-center gap-2">
//                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-xs font-medium">
//                       {user.username?.charAt(0) || user.first_name?.charAt(0) || '?'}
//                     </div>
//                     <div>
//                       <div className="text-sm font-medium">
//                         {user.username ? `@${user.username}` : 'Unknown User'}
//                       </div>
//                       <div className="text-xs text-white/40">
//                         {user.first_name} {user.last_name}
//                       </div>
//                     </div>
//                   </div>
//                 </td>
//                 <td className="px-4 py-3">
//                   <div className="text-sm font-medium">{user.balance?.toFixed(2) || '0.00'} TON</div>
//                 </td>
//                 <td className="px-4 py-3">
//                   <div className="text-sm font-medium">{user.total_withdrawn?.toFixed(2) || '0.00'} TON</div>
//                 </td>
//                 <td className="px-4 py-3">
//                   {user.payout_address || user.payout_wallet ? (
//                     <div className="text-sm font-mono bg-white/5 px-2 py-1 rounded-md truncate max-w-[150px]">
//                       {(user.payout_wallet || user.payout_wallet).substring(0, 6)}...
//                       {(user.payout_wallet || user.payout_wallet).substring((user.payout_wallet || user.wallet_address).length - 4)}
//                     </div>
//                   ) : (
//                     <div className="text-xs text-white/40">No wallet</div>
//                   )}
//                 </td>
//                 <td className="px-4 py-3">
//                   <div className="text-sm">
//                     {new Date(user.created_at).toLocaleDateString()}
//                   </div>
//                 </td>
//                 <td className="px-4 py-3">
//                   <button
//                     onClick={() => handleViewUserDetails(user)}
//                     className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
//                   >
//                     View Details
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* User Details Modal */}
//       {showUserModal && selectedUser && (
//         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
//           <div className="bg-[#0A0A0F] border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <h3 className="text-xl font-bold">User Details</h3>
//                 <button 
//                   onClick={handleCloseUserModal}
//                   className="text-white/60 hover:text-white"
//                 >
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 </button>
//               </div>
              
//               <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
//                 <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-xl font-medium">
//                   {selectedUser.username?.charAt(0) || selectedUser.first_name?.charAt(0) || '?'}
//                 </div>
//                 <div>
//                   <h4 className="text-lg font-bold">
//                     {selectedUser.username ? `@${selectedUser.username}` : 'Unknown User'}
//                   </h4>
//                   <p className="text-white/60">
//                     {selectedUser.first_name} {selectedUser.last_name}
//                   </p>
//                   <p className="text-xs text-white/40 mt-1">
//                     User ID: {selectedUser.id}
//                   </p>
//                 </div>
//               </div>
              
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//                 <div className="bg-white/5 p-4 rounded-lg">
//                   <h5 className="text-sm text-white/60 mb-1">Balance</h5>
//                   <p className="text-lg font-bold">{selectedUser.balance?.toFixed(2) || '0.00'} TON</p>
//                 </div>
//                 <div className="bg-white/5 p-4 rounded-lg">
//                   <h5 className="text-sm text-white/60 mb-1">Total Withdrawn</h5>
//                   <p className="text-lg font-bold">{selectedUser.total_withdrawn?.toFixed(2) || '0.00'} TON</p>
//                 </div>
//                 <div className="bg-white/5 p-4 rounded-lg">
//                   <h5 className="text-sm text-white/60 mb-1">Paid Out</h5>
//                   <p className="text-lg font-bold">{selectedUser.payout_balance?.toFixed(9) || '0.00'} TON</p>
//                 </div>
//                 <div className="bg-white/5 p-4 rounded-lg">
//                   <h5 className="text-sm text-white/60 mb-1">Total Deposit</h5>
//                   <p className="text-lg font-bold">{selectedUser.total_deposit?.toFixed(2) || '0.00'} TON</p>
//                 </div>
//                 <div className="bg-white/5 p-4 rounded-lg">
//                   <h5 className="text-sm text-white/60 mb-1">Total Earned</h5>
//                   <p className="text-lg font-bold">{selectedUser.total_earned?.toFixed(9) || '0.00'} TON</p>
//                 </div>
//                 <div className="bg-white/5 p-4 rounded-lg">
//                   <h5 className="text-sm text-white/60 mb-1">Current Earnings</h5>
//                   <p className="text-lg font-bold">{selectedUser.current_earnings?.toFixed(9) || '0.00'} TON</p>
//                   {selectedUser.earnings_last_update && (
//                     <p className="text-xs text-white/40 mt-1">
//                       Last updated: {new Date(selectedUser.earnings_last_update).toLocaleString()}
//                     </p>
//                   )}
//                 </div>
//                 <div className="bg-white/5 p-4 rounded-lg">
//                   <h5 className="text-sm text-white/60 mb-1">Pending Withdrawal</h5>
//                   <p className="text-lg font-bold">{selectedUser.pending_withdrawal ? 'Yes' : 'No'}</p>
//                 </div>
//               </div>
              
//               {/* Add Payout Address Section */}
//               <div className="bg-white/5 p-4 rounded-lg mb-6">
//                 <h5 className="text-sm text-white/60 mb-1">Payout Address</h5>
//                 {selectedUser.payout_address || selectedUser.payout_wallet ? (
//                   <div className="flex items-center gap-2">
//                     <p className="text-sm font-mono bg-black/30 px-3 py-2 rounded-md overflow-x-auto max-w-full">
//                       {selectedUser.payout_address || selectedUser.payout_wallet}
//                     </p>
//                     <button 
//                       onClick={() => {
//                         navigator.clipboard.writeText(selectedUser.payout_wallet || selectedUser.wallet_address);
//                         // You could add a toast notification here
//                       }}
//                       className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/60 hover:text-white"
//                       title="Copy to clipboard"
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
//                       </svg>
//                     </button>
//                   </div>
//                 ) : (
//                   <p className="text-sm text-white/40">No payout address set</p>
//                 )}
//               </div>
              
//               <div className="mt-6 pt-6 border-t border-white/10">
//                 <h4 className="text-lg font-bold mb-4">Social Tasks</h4>
                
//                 {loadingTasks ? (
//                   <div className="flex items-center justify-center py-4">
//                     <div className="w-6 h-6 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
//                   </div>
//                 ) : (
//                   <>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       {socialTasksList.map(task => (
//                         <div 
//                           key={task.id}
//                           className={`p-3 rounded-lg flex items-center gap-3 ${
//                             userTasks[task.id]?.isCompleted ? 'bg-green-500/10' : 'bg-white/5'
//                           }`}
//                         >
//                           <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                             userTasks[task.id]?.isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'
//                           }`}>
//                             {userTasks[task.id]?.isCompleted ? (
//                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                               </svg>
//                             ) : (
//                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                               </svg>
//                             )}
//                           </div>
//                           <div className="flex-1">
//                             <p className="text-sm font-medium">{task.action}</p>
//                             <div className="flex justify-between items-center">
//                               <p className="text-xs text-white/40">
//                                 {userTasks[task.id]?.isCompleted ? 'Completed' : 'Not completed'}
//                               </p>
//                               <span className="text-xs text-green-400">+{task.reward} NOVA</span>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
                    
//                     {/* Overall completion status */}
//                     <div className="mt-4">
//                       <div className="p-4 bg-black/30 rounded-xl border border-blue-500/20">
//                         <div className="flex items-center justify-between mb-2">
//                           <span className="text-sm text-white/60">Task Progress</span>
//                           <span className="text-sm text-white">
//                             {Object.values(userTasks).filter((t: any) => t.isCompleted).length}/{socialTasksList.length} Completed
//                           </span>
//                         </div>
//                         <div className="relative h-2 bg-blue-900/20 rounded-full overflow-hidden">
//                           <div 
//                             className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000
//                               relative overflow-hidden"
//                             style={{ 
//                               width: `${(Object.values(userTasks).filter((t: any) => t.isCompleted).length / socialTasksList.length) * 100}%` 
//                             }}
//                           >
//                             <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </>
//                 )}
//               </div>
              
//               <div className="mt-6 pt-6 border-t border-white/10">
//                 <h4 className="text-lg font-bold mb-4">Recent Deposits</h4>
                
//                 {loadingDeposits ? (
//                   <div className="flex items-center justify-center py-4">
//                     <div className="w-6 h-6 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
//                   </div>
//                 ) : userDeposits.length > 0 ? (
//                   <div className="overflow-x-auto">
//                     <table className="w-full border-collapse">
//                       <thead>
//                         <tr className="bg-white/5 text-left">
//                           <th className="px-3 py-2 text-xs font-medium text-white/60 rounded-tl-lg">Amount</th>
//                           <th className="px-3 py-2 text-xs font-medium text-white/60">Status</th>
//                           <th className="px-3 py-2 text-xs font-medium text-white/60">Date</th>
//                           <th className="px-3 py-2 text-xs font-medium text-white/60">Transaction</th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-white/5">
//                         {userDeposits.map((deposit) => (
//                           <tr key={deposit.id} className="hover:bg-white/5">
//                             <td className="px-3 py-2">
//                               <div className="text-sm font-medium">{deposit.amount.toFixed(2)} TON</div>
//                             </td>
//                             <td className="px-3 py-2">
//                               <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center ${
//                                 deposit.status === 'completed' 
//                                   ? 'bg-green-500/20 text-green-400' 
//                                   : deposit.status === 'pending'
//                                   ? 'bg-yellow-500/20 text-yellow-400'
//                                   : 'bg-red-500/20 text-red-400'
//                               }`}>
//                                 <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
//                                   deposit.status === 'completed' 
//                                     ? 'bg-green-400' 
//                                     : deposit.status === 'pending'
//                                     ? 'bg-yellow-400'
//                                     : 'bg-red-400'
//                                 }`}></span>
//                                 {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
//                               </div>
//                             </td>
//                             <td className="px-3 py-2">
//                               <div className="text-sm">
//                                 {new Date(deposit.created_at).toLocaleDateString()}
//                               </div>
//                               <div className="text-xs text-white/40">
//                                 {new Date(deposit.created_at).toLocaleTimeString()}
//                               </div>
//                             </td>
//                             <td className="px-3 py-2">
//                               {deposit.tx_hash ? (
//                                 <a 
//                                   href={`https://tonscan.org/tx/${deposit.tx_hash}`}
//                                   target="_blank"
//                                   rel="noopener noreferrer"
//                                   className="text-xs font-mono bg-white/5 px-2 py-1 rounded-md truncate max-w-[120px] inline-block hover:bg-white/10"
//                                 >
//                                   {deposit.tx_hash.substring(0, 6)}...{deposit.tx_hash.substring(deposit.tx_hash.length - 4)}
//                                 </a>
//                               ) : (
//                                 <div className="text-xs text-white/40">No transaction hash</div>
//                               )}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 ) : (
//                   <div className="text-center py-4 bg-white/5 rounded-lg">
//                     <p className="text-white/60">No recent deposits</p>
//                   </div>
//                 )}
//               </div>
              
//               {/* Referrals Section */}
//               <div className="mt-6 pt-6 border-t border-white/10">
//                 <h4 className="text-lg font-bold mb-4">Referrals</h4>
                
//                 {loadingReferrals ? (
//                   <div className="flex items-center justify-center py-4">
//                     <div className="w-6 h-6 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
//                   </div>
//                 ) : userReferrals.length > 0 ? (
//                   <div className="overflow-x-auto">
//                     <table className="w-full border-collapse">
//                       <thead>
//                         <tr className="bg-white/5 text-left">
//                           <th className="px-3 py-2 text-xs font-medium text-white/60 rounded-tl-lg">User</th>
//                           <th className="px-3 py-2 text-xs font-medium text-white/60">Balance</th>
//                           <th className="px-3 py-2 text-xs font-medium text-white/60">Total Deposit</th>
//                           <th className="px-3 py-2 text-xs font-medium text-white/60 rounded-tr-lg">Joined</th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-white/5">
//                         {userReferrals.map((referral) => (
//                           <tr key={referral.id} className="hover:bg-white/5">
//                             <td className="px-3 py-2">
//                               <div className="flex items-center gap-2">
//                                 <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-xs font-medium">
//                                   {referral.username?.charAt(0) || referral.first_name?.charAt(0) || '?'}
//                                 </div>
//                                 <div>
//                                   <div className="text-sm font-medium">
//                                     {referral.username ? `@${referral.username}` : 'Unknown User'}
//                                   </div>
//                                   <div className="text-xs text-white/40">
//                                     {referral.first_name} {referral.last_name}
//                                   </div>
//                                 </div>
//                               </div>
//                             </td>
//                             <td className="px-3 py-2">
//                               <div className="text-sm font-medium">{referral.balance?.toFixed(2) || '0.00'} TON</div>
//                             </td>
//                             <td className="px-3 py-2">
//                               <div className="text-sm font-medium">{referral.total_deposit?.toFixed(2) || '0.00'} TON</div>
//                             </td>
//                             <td className="px-3 py-2">
//                               <div className="text-sm">
//                                 {new Date(referral.created_at).toLocaleDateString()}
//                               </div>
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 ) : (
//                   <div className="text-center py-4 bg-white/5 rounded-lg">
//                     <p className="text-white/60">No referrals</p>
//                   </div>
//                 )}
//               </div>
              
//               <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
//                 <button
//                   onClick={handleCloseUserModal}
//                   className="px-4 py-2 text-sm font-medium rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdminWithdrawalPanel; 