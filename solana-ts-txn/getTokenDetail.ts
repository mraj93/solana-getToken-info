import { Connection, PublicKey } from '@solana/web3.js'
import { Metaplex } from '@metaplex-foundation/js'

const SOLANA_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=abc1f090-f939-44ea-9c74-96d613d2c87a'

interface TokenPriceData {
    data: {
        liquidity: BigInt;
        updateHumanTime: string;
        value: BigInt;
    };
}

interface TokenInfo {
    name: string;
    symbol: string;
    logo: string | undefined;
    supply:BigInt;
    liquidity: BigInt;
    LaunchTime: string;
    price: string;
    marketCap: BigInt;
    website: string | undefined;
    twitter: string | undefined;
    telegram: string | undefined;
    description: string | undefined;
    mutable: boolean;
    mintAuthority: boolean;
    freezeAuthority: boolean;
    lpBurned: boolean;
    topHolders: {
        address: string;
        value: BigInt;
    }[];
}

export async function getPrice(address: string): Promise<TokenPriceData | undefined> {
    const url = `https://public-api.birdeye.so/defi/price?include_liquidity=true&address=${address}`

    const headers = {
        accept: 'application/json',
        'x-chain': 'solana',
        'X-API-KEY': '8dc5966996484dfaa4a15c0bffcc76ec',
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
        })

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText)
        }

        const data: TokenPriceData = await response.json()
        return data
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error)
    }
}

async function getTokenInfo(address: string): Promise<TokenInfo | undefined> {
    console.log(`in getTokenInfo: ${address}`)
    const connection = new Connection(SOLANA_RPC_URL)
    // console.log(`connection is`, connection)
    const metaplex = Metaplex.make(connection)

    const mintAddress = new PublicKey(address)

    try {
        const metadataAccount = metaplex
            .nfts()
            .pdas()
            .metadata({ mint: mintAddress })
        const metadataAccountInfo = await connection.getAccountInfo(
            metadataAccount,
        )
        const largestAccounts = await connection.getTokenLargestAccounts(
            mintAddress,
        )

        const accountBalance = await connection.getBalance(mintAddress)
        console.log('Account Balance:', accountBalance)

        const topHolders = largestAccounts.value.slice(0, 2).map((account) => ({
            address: account.address.toString(),
            value: account.uiAmount,
        }))

        const tokenPriceData = await getPrice(address)
        if (!tokenPriceData) {
            throw new Error('Failed to fetch token price data')
        }

        const liquidity = tokenPriceData?.data?.liquidity
        const LaunchTime = tokenPriceData?.data?.updateHumanTime
        const tokenPrice = Number(tokenPriceData?.data?.value).toFixed(17)

        if (metadataAccountInfo) {
            const token = await metaplex.nfts().findByMint({ mintAddress })

            const tokenName = token.name
            const tokenSymbol = token.symbol
            const tokenLogo = token.json?.image
            const decimals = token.mint.supply.currency.decimals
            const supply = token.mint.supply.basisPoints / Math.pow(10, decimals)
            const marketCap = supply * parseFloat(tokenPrice)

            const website = token.json?.extensions?.website
            const twitter = token.json?.extensions?.twitter
            const telegram = token.json?.extensions?.telegram
            const description = token.json?.description
            const isMutable = token.isMutable
            const mintAuthority = !!token.mint.mintAuthorityAddress
            const freezeAuthority = !!token.mint.freezeAuthorityAddress
            const lpBurned = token.mint.isWrappedSol

            const tokenInfo: TokenInfo = {
                name: tokenName,
                symbol: tokenSymbol,
                logo: tokenLogo,
                supply,
                liquidity,
                LaunchTime,
                price: tokenPrice,
                marketCap,
                website,
                twitter,
                telegram,
                description,
                mutable: isMutable,
                mintAuthority,
                freezeAuthority,
                lpBurned,
                topHolders,
            }

            console.log("Token Information:", tokenInfo);

            return tokenInfo
        }
    } catch (error) {
        console.error('Error fetching token information:', error)
    }
}

export { getTokenInfo }