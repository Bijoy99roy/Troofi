import { create, createV1, fetchAsset, findAssetSignerPda, mplCore } from '@metaplex-foundation/mpl-core'
import {
  createGenericFile,
  generateSigner,
  keypairIdentity,
  type TransactionBuilderSendAndConfirmOptions,
  type Umi,
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mockStorage  } from '@metaplex-foundation/umi-storage-mock'
import fs from 'fs'
import path from 'path'


async function uploadImageLocal(imagePath: string, umi: Umi) {
  const imageFile = fs.readFileSync(path.join(imagePath))
  const umiImageFile = createGenericFile(imageFile, 'image.png')

  console.log('Uploading Image (mock)...')
  const [imageUri] = await umi.uploader.upload([umiImageFile])

  console.log('Image URI:', imageUri)
  return imageUri
}

async function uploadMetadataLocal(metadata: any, umi: Umi) {
  console.log('Uploading Metadata (mock)...')
  const metadataUri = await umi.uploader.uploadJson(metadata)
  console.log('Metadata URI:', metadataUri)
  return metadataUri
}

async function mintLocal(name: string, metadataUri: string, umi: Umi) {
    
  const nftSigner = generateSigner(umi)

  console.log('Creating Core NFT on localnet...')
  const tx = await create(umi, {
    asset: nftSigner,
      name: name,
      uri: "https://mockstorage.example.com/8jjUsRhejXxYlzVaH7gT",
    }).sendAndConfirm(umi)

  console.log('NFT Created Successfully (Localnet)')
  console.log('NFT Address:', nftSigner.publicKey)
  console.log('Transaction Signature:', tx.signature)
  return nftSigner
}


export async function mintNftLocal(umi, wallet) {
    
  try {
    // Connect to LOCALNET with mock uploader
           
    
    umi.use(keypairIdentity(wallet))
    // Upload image → mock local URL
    // const imageUri = await uploadImageLocal('/home/roy/solana_projs/troofi/tests/images/squirtle.png', umi)

    const name = 'Squirtle'
    const metadata = {
      name,
      description: 'A small water Pokémon.',
      image: "",
    }

    // const metadataUri = await uploadMetadataLocal(metadata, umi)
    
    const nftSigner = await mintLocal(name, "metadataUri", umi)

    console.log('Verifying asset exists...')
    const asset = await fetchAsset(umi, nftSigner.publicKey)
    

    console.log('Address:', nftSigner.publicKey)
    console.log('Owner:', asset.owner)
    console.log('Name:', asset.name)

    
    const [assetPda] = findAssetSignerPda(umi, {
    asset: nftSigner.publicKey,
  });
  console.log(assetPda)
    return {nftSigner, assetPda}
  } catch (err) {
    console.error('Error during local minting:', err)
  }
}


