import { BigNumberish, ethers } from "ethers";

export const getProposalIdFromTx = async (tx: string, abi: any, eventTopic: string): Promise<BigNumberish | null> => {
  // create provider from alchemy
  const provider = new ethers.providers.AlchemyProvider(
    "maticmum",
    process.env.NEXT_PUBLIC_ALCHEMY_KEY || "2olqx6rQSWK3TThRmPvylRkNPbD0dDNj",
  );
  // Create a contract interface
  const contractInterface = new ethers.utils.Interface(abi);

  // Find the event topic
  const createdEventTopic = contractInterface.getEventTopic(eventTopic);
  console.log("**** createdEventTopic: ", createdEventTopic);

  const transactionReceipt = await provider.getTransactionReceipt(tx);

  console.log("**** transactionReceipt: ", transactionReceipt);

  // Filter the logs for the Created event
  const createdEventLogs = transactionReceipt.logs.filter(log => log.topics[0] === createdEventTopic);

  console.log("**** createdEventLogs: ", createdEventLogs);

  // Extract from the data field of the first log (if it exists)
  if (createdEventLogs.length > 0) {
    const decodedEvent = contractInterface.decodeEventLog(eventTopic, createdEventLogs[0].data);
    const result = decodedEvent.proposalId;
    return result;
  } else {
    return null;
  }
};
