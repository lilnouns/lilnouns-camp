import { fetchContractSimulation } from "@/app/api/tenderly-utils";

// export const runtime = 'edge';

export async function POST(request) {
  const body = await request.json();
  return fetchContractSimulation({ from: body.account, ...body });
}
