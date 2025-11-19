import { create } from '@metaplex-foundation/mpl-core'
import {
  createGenericFile,
  generateSigner,
  keypairIdentity,
  type TransactionBuilderSendAndConfirmOptions,
  type Umi,
} from '@metaplex-foundation/umi'


async function mintLocal(name: string, umi: Umi) {
    
  const nftSigner = generateSigner(umi)

  console.log('Creating Core NFT on localnet...')
  const tx = await create(umi, {
    asset: nftSigner,
      name: name,
      uri: "https://mockstorage.example.com/8jjUsRhejXxYlzVaH7gT",
      authority: umi.identity
    }).sendAndConfirm(umi)

  console.log('NFT Created Successfully (Localnet)')
  return nftSigner
}


export async function mintNftLocal(umi, wallet) {
    
  try {

    umi.use(keypairIdentity(wallet))


    const name = 'Squirtle'
    const metadata = {
      name,
      description: 'A small water Pokémon.',
      image: "",
    }

    // const metadataUri = await uploadMetadataLocal(metadata, umi)
    
    const nftSigner = await mintLocal(name, umi)
    
    return nftSigner
  } catch (err) {
    console.error('Error during local minting:', err)
  }
}


