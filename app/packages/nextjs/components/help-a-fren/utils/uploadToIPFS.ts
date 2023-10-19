import { PINATA_PINJSONTOIPFS_URL } from "../../../utils/constants";

export interface Metadata {
  proposalId: string;
  description: ProposalDescription;
  external_url: string;
  imageCID: string;
}

interface ProposalDescription {
  submitter?: string;
  wallet?: string;
  title?: string;
  recipient?: string;
  reason?: string;
  use?: string;
  amount?: string;
}

export const uploadMetadata = async ({ proposalId, description, external_url, imageCID }: Metadata) => {
  try {
    const data = JSON.stringify({
      pinataContent: {
        proposalId: proposalId,
        description: description,
        external_url: external_url,
        image: imageCID,
      },
      pinataMetadata: {
        keyvalues: {
          proposalId: proposalId,
          date: new Date().toLocaleString(),
        },
        name: `Help-A-Fren Proposal`,
      },
    });

    const res = await fetch(PINATA_PINJSONTOIPFS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_API_KEY}`,
      },
      body: data,
    });
    const resData = await res.json();
    console.log("Metadata uploaded, CID:", resData.IpfsHash);
    return resData.IpfsHash;
  } catch (error) {
    console.log(error);
  }
};
