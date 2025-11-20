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
import { assert } from "chai";
describe("troofi", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.troofi as Program<Troofi>;

  const provider = anchor.getProvider();

  const wallet = anchor.web3.Keypair.generate()
  const nftBucket = {}
  let marketplaceBucket;
  const umi = createUmi("http://0.0.0.0:8899", "confirmed")
      .use(mplCore())
      .use(dasApi())

    // const umi2 = createUmi('http://127.0.0.1:8899/')
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

  const admin = loadKeypairFromFileST("/home/roy/solana_projs/troofi/nftuLPVQupTr1coaiWzNV2WC8gchv12SsRz5JV32jLf.json")

  async function getPda(seeds) {
    const [pda, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      seeds,
      program.programId
    );

    return {pda, bump}
  }

  async function prepareNFT(asset, id){
    if (id in nftBucket){

      return nftBucket[id]
      }

    const {pda: listingPda} =  await getPda([Buffer.from("listing"), sellet.publicKey.toBuffer(), asset.toBuffer()])
    
    const {pda: userPda} = await getPda([Buffer.from("user"), sellet.publicKey.toBuffer()])

    const {pda: vaultPda} = await getPda([Buffer.from("vault"), sellet.publicKey.toBuffer()])

    
    
    nftBucket[id] = {
      asset,
      listingPda,
      userPda,
      vaultPda,
    }

    return nftBucket[id]

  }

  async function prepareMarketplace() {
    const {pda: marketplaceFeeVault} = await getPda([Buffer.from("marketplace_fee"), admin.publicKey.toBuffer()])
    const {pda: marketplacePda} = await getPda([Buffer.from("marketplace"), admin.publicKey.toBuffer()])
    marketplaceBucket = {
      marketplaceFeeVault,
      marketplacePda
    }

    return marketplaceBucket;
  }

  async function getAirdrop(
    publicKey: anchor.web3.PublicKey,
    amount: number = 100 * anchor.web3.LAMPORTS_PER_SOL
  ){
    const airdropTxn = await provider.connection.requestAirdrop(
      publicKey,
      amount
    );

    await provider.connection.confirmTransaction(airdropTxn);
  }

  before(async ()=>{
    await getAirdrop(wallet.publicKey);    
  })

  it("Initalize Fee Vault", async  ()=>{
    const {
      marketplaceFeeVault,
      marketplacePda
    } = await prepareMarketplace()

    await program.methods.initalizeFeesVault()
    .accountsPartial({
      admin: admin.publicKey,
      marketplacePda,
      feeVault: marketplaceFeeVault
    }).signers([admin])
    .rpc()

    const accounts = await program.account.marketplace.fetch(marketplacePda)

    assert.equal(accounts.admin.toString(), admin.publicKey.toString());
    assert.equal(accounts.feeNumerator.toNumber(), 25);
    assert.equal(accounts.feeDenominator.toNumber(), 10000);
  });

  it("Initalize Listing", async () => {
    // Add your test here.
  
    const nftSigner = await mintNftLocal(umi, selletKeypair)
    // const asseta = await fetchAsset(umi, nftSigner.publicKey);
    const  asset =  new anchor.web3.PublicKey(nftSigner.publicKey)
    const {
      _,
      listingPda,
      userPda,
      vaultPda,
    } = await prepareNFT(asset, 1)

    const price = new anchor.BN(1*anchor.web3.LAMPORTS_PER_SOL);
    // const assetAccounta = await fetchAsset(umi, publicKey(asset.toString()));
    // console.log("Asset owner:", assetAccounta.owner.toString());
   
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

    const balance = await provider.connection.getBalance(vaultPda);
  // Convert lamports to SOL
  const solBalance = balance / anchor.web3.LAMPORTS_PER_SOL;


//   const assetsByOwner = await fetchAssetsByOwner(umi, listingPda.toString(), {
//   skipDerivePlugins: false,
// })

// console.log(assetsByOwner)



const assetAccount = await fetchAsset(umi, publicKey(nftSigner.publicKey.toString()));


assert.equal(listingPda.toString(), assetAccount.owner.toString())
    
  });

  it("Buy listing", async()=>{
    const {
      asset,
      listingPda,
      userPda,
      vaultPda,
    } = await prepareNFT(null, 1)

    const {
      marketplaceFeeVault,
      marketplacePda
    } = marketplaceBucket;
    await program.methods.buyListing()
    .accountsPartial({
      buyer: wallet.publicKey,
      asset,
      listingPda,
      userPda,
      vaultPda,
      marketplacePda,
      feeVault: marketplaceFeeVault,
      mplCoreProgram: MPL_CORE_PROGRAM_ID

    }).signers([wallet])
    .rpc()


    const assetAccount = await fetchAsset(umi, publicKey(asset.toString()));
    // console.log("Asset:", assetAccount);
 
    const sellerVaultBalance = await provider.connection.getBalance(vaultPda);

    const balanceInSol = sellerVaultBalance / anchor.web3.LAMPORTS_PER_SOL;
  
    
    assert.equal(wallet.publicKey.toString(), assetAccount.owner.toString())



  });

  it("Withdraw Funds", async()=>{
    const {
      asset,
      listingPda,
      userPda,
      vaultPda,
    } = await prepareNFT(null, 1)

    const VaultBalanceBefore = await provider.connection.getBalance(vaultPda);
    const balanceInSolBefore = VaultBalanceBefore / anchor.web3.LAMPORTS_PER_SOL;

    const sellerBalanceBefore = await provider.connection.getBalance(sellet.publicKey);
    const balanceInSolSellerBefore = sellerBalanceBefore / anchor.web3.LAMPORTS_PER_SOL;
    try{
      await program.methods.withdrawFunds()
    .accountsPartial({
      seller: sellet.publicKey,
      userPda,
      vaultPda,
    }).signers([sellet])
    .rpc()
    } catch(err){
      console.log(err)
    }
    


    const VaultBalanceAfter = await provider.connection.getBalance(vaultPda);
    const balanceInSolAfter = VaultBalanceAfter / anchor.web3.LAMPORTS_PER_SOL;

    const sellerBalanceAfter = await provider.connection.getBalance(sellet.publicKey);
    const balanceInSolSellerAfter = sellerBalanceAfter / anchor.web3.LAMPORTS_PER_SOL;

    const vaultRent = await provider.connection.getMinimumBalanceForRentExemption(0) / anchor.web3.LAMPORTS_PER_SOL

    const finalSellerBalance = balanceInSolSellerBefore + balanceInSolBefore - vaultRent;
    
    assert.equal(balanceInSolSellerAfter.toPrecision(7), finalSellerBalance.toPrecision(7))
    assert.equal(balanceInSolAfter.toPrecision(7), vaultRent.toPrecision(7))



  });

  it("Cancel Listing", async () => {
    // Add your test here.
  
    const nftSigner = await mintNftLocal(umi, selletKeypair)
    // const asseta = await fetchAsset(umi, nftSigner.publicKey);
    const  asset =  new anchor.web3.PublicKey(nftSigner.publicKey)
    const {
      _,
      listingPda,
      userPda,
      vaultPda,
    } = await prepareNFT(asset, 2)

    const price = new anchor.BN(1*anchor.web3.LAMPORTS_PER_SOL);
    // const assetAccounta = await fetchAsset(umi, publicKey(asset.toString()));
    // console.log("Asset owner:", assetAccounta.owner.toString());
 
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

  const assetAccountBefore = await fetchAsset(umi, publicKey(nftSigner.publicKey.toString()));


  assert.equal(listingPda.toString(), assetAccountBefore.owner.toString())



  await program.methods.cancelListing()
  .accountsPartial({
    seller: sellet.publicKey,
    asset,
    listingPda,
    mplCoreProgram: MPL_CORE_PROGRAM_ID
  })
  .signers([sellet])
  .rpc();

  const assetAccountAfter = await fetchAsset(umi, publicKey(nftSigner.publicKey.toString()));


  assert.equal(sellet.publicKey.toString(), assetAccountAfter.owner.toString())
    
  });

  it("Withdraw Fee", async ()=>{
    const {
      marketplaceFeeVault,
      marketplacePda
    } = marketplaceBucket;

    const feeVaultBalanceBeforeInLamport = await provider.connection.getBalance(marketplaceFeeVault);
    const feeVaultBalanceBefore = feeVaultBalanceBeforeInLamport / anchor.web3.LAMPORTS_PER_SOL;

    const adminBalanceBefore = await provider.connection.getBalance(admin.publicKey);
    const balanceInSolAdminBefore = adminBalanceBefore / anchor.web3.LAMPORTS_PER_SOL;

    await program.methods.withdrawFees()
    .accountsPartial({
      admin: admin.publicKey,
      marketplacePda,
      feeVault: marketplaceFeeVault
    }).signers([admin])
    .rpc();

    const feeVaultBalanceAfterInLamport = await provider.connection.getBalance(marketplaceFeeVault);
    const feeVaultBalanceAfter = feeVaultBalanceAfterInLamport / anchor.web3.LAMPORTS_PER_SOL;

    const vaultRent = await provider.connection.getMinimumBalanceForRentExemption(0) / anchor.web3.LAMPORTS_PER_SOL

    const finaladminBalance = balanceInSolAdminBefore + feeVaultBalanceBefore - vaultRent;

    const adminBalanceAfterInLamport = await provider.connection.getBalance(admin.publicKey);
    const adminBalanceAfter = adminBalanceAfterInLamport / anchor.web3.LAMPORTS_PER_SOL;


    assert.equal(adminBalanceAfter.toString(), finaladminBalance.toString())

    assert.equal(feeVaultBalanceAfter.toString(), vaultRent.toString())


  });
});
