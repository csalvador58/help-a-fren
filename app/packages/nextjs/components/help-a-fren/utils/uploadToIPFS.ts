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

    // Provided Pinata API Key is limited. Aquire your own API key from https://www.pinata.cloud
    const res = await fetch(PINATA_PINJSONTOIPFS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${
          process.env.NEXT_PUBLIC_PINATA_API_KEY ||
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI5OGRjNDYwMi1jNTRhLTQzYzMtOTgzZi1kYjNkZjlmMjA2YzIiLCJlbWFpbCI6InNhbHZhZG9yLndlYjNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJGUkExIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9LHsiaWQiOiJOWUMxIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjQ3YWY5OTg4ODQzNWE4OWM5YTk1Iiwic2NvcGVkS2V5U2VjcmV0IjoiZmZkY2FlZTUzMDYzMzAyYWQxNjc4ZWEyODM5MzYyNmY5MTE4YTAxMDRkMDA3MjZmYWJhMDE5ZjY1YzIwZWM4NSIsImlhdCI6MTY5NzgwMzQzOH0.5eMcL0e5FEgSEsnvoq2k3DhiUjhFH3TI4q5Sj02DfoE"
        }`,
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
