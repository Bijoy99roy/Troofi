import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Troofi } from "../target/types/troofi";
import {fetchAsset, fetchAssetsByOwner, MPL_CORE_PROGRAM_ID} from "@metaplex-foundation/mpl-core"
import {mintNftLocal} from "./nft.helper"
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { create, mplCore } from '@metaplex-foundation/mpl-core'
import fs from 'fs'
import { generateSigner, publicKey } from "@metaplex-foundation/umi";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";
describe("troofi", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.troofi as Program<Troofi>;

  const provider = anchor.getProvider();

  const wallet = anchor.web3.Keypair.generate()
  const umi = createUmi('http://127.0.0.1:8899/')
      .use(mplCore())
      .use(dasApi())
  function loadKeypairFromFile(secretFilePath: string){
    const secret = JSON.parse(fs.readFileSync(secretFilePath, "utf-8"));
    const secretKey = Uint8Array.from(secret)
    return umi.eddsa.createKeypairFromSecretKey(secretKey)
}
function loadKeypairFromFileST(secretFilePath: string){
    const secret = JSON.parse(fs.readFileSync(secretFilePath, "utf-8"));
    const secretKey = Uint8Array.from(secret)
    return anchor.web3.Keypair.fromSecretKey(secretKey)
}
  const selletKeypair = loadKeypairFromFile("/home/roy/solana_projs/troofi/nftuLPVQupTr1coaiWzNV2WC8gchv12SsRz5JV32jLf.json")
  const sellet = loadKeypairFromFileST("/home/roy/solana_projs/troofi/nftuLPVQupTr1coaiWzNV2WC8gchv12SsRz5JV32jLf.json")
  async function getPda(seeds) {
    const [pda, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      seeds,
      program.programId
    );

    return {pda, bump}
  }

  it("Is initialized!", async () => {
    // Add your test here.
    
    const {nftSigner, assetPda} = await mintNftLocal(umi, selletKeypair)
    // const asseta = await fetchAsset(umi, nftSigner.publicKey);
    const  asset =  new anchor.web3.PublicKey(nftSigner.publicKey)
    const {pda: listingPda} =  await getPda([Buffer.from("listing"), sellet.publicKey.toBuffer(), asset.toBuffer()])
    
    const {pda: userPda} = await getPda([Buffer.from("user"), sellet.publicKey.toBuffer()])

    const {pda: vaultPda} = await getPda([Buffer.from("vault"), sellet.publicKey.toBuffer()])

    const price = new anchor.BN(1*anchor.web3.LAMPORTS_PER_SOL);
    const assetAccounta = await fetchAsset(umi, publicKey(asset.toString()));
    console.log("Asset owner:", assetAccounta.owner.toString());
    const txn = await program.methods.initializeListing(price).accountsPartial({
      seller: sellet.publicKey,
      asset: asset,
      listingPda,
      userPda,
      vaultPda,
      mplCoreProgram: MPL_CORE_PROGRAM_ID
    })
    .signers([sellet])
    .rpc()
    console.log(`Signature: ${txn}`)
    const balance = await provider.connection.getBalance(vaultPda);
  // Convert lamports to SOL
  const solBalance = balance / anchor.web3.LAMPORTS_PER_SOL;
  console.log(`${vaultPda} has ${solBalance} SOL`) 

  const assetsByOwner = await fetchAssetsByOwner(umi, listingPda.toString(), {
  skipDerivePlugins: false,
})

console.log(assetsByOwner)

const assetAccount = await fetchAsset(umi, publicKey(asset.toString()));
console.log("Asset owner after transfer:", assetAccount.owner.toString());
    
  });
});
