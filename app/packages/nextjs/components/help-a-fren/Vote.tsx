// import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";

// export const Vote = () => {
//   return (
//     <>
//       <div className="card w-full glass shadow-xl">
//         <div className="card-body">
//           <h2 className="card-title">
//             Vote ***REQUIRED SIGN-IN TO VIEW PAGE, USER CAN CLICK ANY SUBMIT WITHOUT RE-SIGN-IN***
//           </h2>
//           <p>Claims a vote NFT, only one token can be claimed</p>
//           <p>Indicate if you are for, against, or abstain from the proposal request. Be sure to submit each vote.</p>
//           <div className="form-control">
//             <h3>Proposal 1</h3>
//             <p>
//               Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eleifend non sapien a condimentum. Nunc
//               imperdiet lorem non massa lobortis dignissim. Nam at nibh iaculis, sagittis sem non, scelerisque tortor.
//               Phasellus dictum lorem at felis fringilla efficitur sit amet a ante. Pellentesque at molestie velit, eu
//               finibus sem.
//             </p>
//             <div className="w-full max-w-xs">
//               <label className="label">
//                 <span className="label-text">Decision</span>
//               </label>
//               <select className="select select-bordered">
//                 <option disabled selected>
//                   Select
//                 </option>
//                 <option>For</option>
//                 <option>Against</option>
//                 <option>Abstain</option>
//               </select>
//             </div>
//             <h3>Asking</h3>
//             <p>$XX,XXX</p>
//             <div className="card-actions justify-end">
//               <button className="btn btn-accent">Submit</button>
//             </div>
//           </div>
//           <div className="form-control">
//             <h3>Proposal 2</h3>
//             <p>
//               Donec risus nunc, gravida quis congue et, convallis ut ipsum. In scelerisque dictum diam sit amet
//               eleifend. Pellentesque non ipsum ac diam cursus aliquet non id est.
//             </p>
//             <div className="w-full max-w-xs">
//               <label className="label">
//                 <span className="label-text">Decision</span>
//               </label>
//               <select className="select select-bordered">
//                 <option disabled selected>
//                   Select
//                 </option>
//                 <option>For</option>
//                 <option>Against</option>
//                 <option>Abstain</option>
//               </select>
//             </div>
//             <h3>Asking</h3>
//             <p>$XX,XXX</p>
//             <div className="card-actions justify-end">
//               <button className="btn btn-accent">Submit</button>
//             </div>
//           </div>
//           <div className="form-control">
//             <h3>Proposal 3</h3>
//             <p>
//               Sed hendrerit porttitor ex a pulvinar. Pellentesque at accumsan nisi, eu commodo nibh. In ultrices, augue
//               at bibendum mollis, neque eros aliquet est, vel ullamcorper ex neque ac magna.
//             </p>
//             <div className="w-full max-w-xs">
//               <label className="label">
//                 <span className="label-text">Decision</span>
//               </label>
//               <select className="select select-bordered">
//                 <option disabled selected>
//                   Select
//                 </option>
//                 <option>For</option>
//                 <option>Against</option>
//                 <option>Abstain</option>
//               </select>
//             </div>
//             <h3>Asking</h3>
//             <p>Unlimited, On-Going</p>
//             <div className="card-actions justify-end">
//               <button className="btn btn-accent">Submit</button>
//             </div>
//           </div>
//           <div className="card-actions justify-end">
//             <button
//               className="btn btn-accent"
//               onClick={handleNFTTokenClaim}
//               disabled={isClaimVoteTokenLoading || isDelegateVoteTokenLoading}
//             >
//               {isClaimVoteTokenLoading || isDelegateVoteTokenLoading ? (
//                 <span className="loading loading-spinner loading-sm"></span>
//               ) : (
//                 <>
//                   Claim <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };
