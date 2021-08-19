module.exports = {
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.node = {
        fs: 'empty'
      }
    }

    return config
  },
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      '/': { page: '/rewards' },
      '/rewards': { page: '/rewards' },
      '/add': { page: '/add' },
      '/add/0x7ca5b0a2910B33e9759DC7dDB0413949071D7575': { page: '/add/[address]', query: { address: '0x7ca5b0a2910B33e9759DC7dDB0413949071D7575' } },
      '/add/0xBC89cd85491d81C6AD2954E6d0362Ee29fCa8F53': { page: '/add/[address]', query: { address: '0xBC89cd85491d81C6AD2954E6d0362Ee29fCa8F53' } },
      '/add/0xFA712EE4788C042e2B7BB55E6cb8ec569C4530c1': { page: '/add/[address]', query: { address: '0xFA712EE4788C042e2B7BB55E6cb8ec569C4530c1' } },
      '/add/0x69Fb7c45726cfE2baDeE8317005d3F94bE838840': { page: '/add/[address]', query: { address: '0x69Fb7c45726cfE2baDeE8317005d3F94bE838840' } },
      '/add/0x64E3C23bfc40722d3B649844055F1D51c1ac041d': { page: '/add/[address]', query: { address: '0x64E3C23bfc40722d3B649844055F1D51c1ac041d' } },
      '/add/0xB1F2cdeC61db658F091671F5f199635aEF202CAC': { page: '/add/[address]', query: { address: '0xB1F2cdeC61db658F091671F5f199635aEF202CAC' } },
      '/add/0xA90996896660DEcC6E997655E065b23788857849': { page: '/add/[address]', query: { address: '0xA90996896660DEcC6E997655E065b23788857849' } },
      '/add/0x705350c4BcD35c9441419DdD5d2f097d7a55410F': { page: '/add/[address]', query: { address: '0x705350c4BcD35c9441419DdD5d2f097d7a55410F' } },
      '/add/0x4c18E409Dc8619bFb6a1cB56D114C3f592E0aE79': { page: '/add/[address]', query: { address: '0x4c18E409Dc8619bFb6a1cB56D114C3f592E0aE79' } },
      '/add/0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A': { page: '/add/[address]', query: { address: '0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A' } },
      '/add/0x18478F737d40ed7DEFe5a9d6F1560d84E283B74e': { page: '/add/[address]', query: { address: '0x18478F737d40ed7DEFe5a9d6F1560d84E283B74e' } },
      '/add/0xC5cfaDA84E902aD92DD40194f0883ad49639b023': { page: '/add/[address]', query: { address: '0xC5cfaDA84E902aD92DD40194f0883ad49639b023' } },
      '/add/0x2db0E83599a91b508Ac268a6197b8B14F5e72840': { page: '/add/[address]', query: { address: '0x2db0E83599a91b508Ac268a6197b8B14F5e72840' } },
      '/add/0xC2b1DF84112619D190193E48148000e3990Bf627': { page: '/add/[address]', query: { address: '0xC2b1DF84112619D190193E48148000e3990Bf627' } },
      '/add/0xF98450B5602fa59CC66e1379DFfB6FDDc724CfC4': { page: '/add/[address]', query: { address: '0xF98450B5602fa59CC66e1379DFfB6FDDc724CfC4' } },
      '/add/0x5f626c30EC1215f4EdCc9982265E8b1F411D1352': { page: '/add/[address]', query: { address: '0x5f626c30EC1215f4EdCc9982265E8b1F411D1352' } },
      '/add/0x6828bcF74279eE32f2723eC536c22c51Eed383C6': { page: '/add/[address]', query: { address: '0x6828bcF74279eE32f2723eC536c22c51Eed383C6' } },
      '/add/0x4dC4A289a8E33600D8bD4cf5F6313E43a37adec7': { page: '/add/[address]', query: { address: '0x4dC4A289a8E33600D8bD4cf5F6313E43a37adec7' } },
      '/add/0xAEA6c312f4b3E04D752946d329693F7293bC2e6D': { page: '/add/[address]', query: { address: '0xAEA6c312f4b3E04D752946d329693F7293bC2e6D' } },
      '/add/0xdFc7AdFa664b08767b735dE28f9E84cd30492aeE': { page: '/add/[address]', query: { address: '0xdFc7AdFa664b08767b735dE28f9E84cd30492aeE' } },
      '/add/0x11137B10C210b579405c21A07489e28F3c040AB1': { page: '/add/[address]', query: { address: '0x11137B10C210b579405c21A07489e28F3c040AB1' } },
      '/add/0xd7d147c6Bb90A718c3De8C0568F9B560C79fa416': { page: '/add/[address]', query: { address: '0xd7d147c6Bb90A718c3De8C0568F9B560C79fa416' } },
      '/add/0x3B7020743Bc2A4ca9EaF9D0722d42E20d6935855': { page: '/add/[address]', query: { address: '0x3B7020743Bc2A4ca9EaF9D0722d42E20d6935855' } },
      '/add/0x90Bb609649E0451E5aD952683D64BD2d1f245840': { page: '/add/[address]', query: { address: '0x90Bb609649E0451E5aD952683D64BD2d1f245840' } },
      '/add/0x3C0FFFF15EA30C35d7A85B85c0782D6c94e1d238': { page: '/add/[address]', query: { address: '0x3C0FFFF15EA30C35d7A85B85c0782D6c94e1d238' } },
      '/add/0xd662908ADA2Ea1916B3318327A97eB18aD588b5d': { page: '/add/[address]', query: { address: '0xd662908ADA2Ea1916B3318327A97eB18aD588b5d' } },
      '/add/0xd69ac8d9D25e99446171B5D0B3E4234dAd294890': { page: '/add/[address]', query: { address: '0xd69ac8d9D25e99446171B5D0B3E4234dAd294890' } },
      '/add/0x182B723a58739a9c974cFDB385ceaDb237453c28': { page: '/add/[address]', query: { address: '0x182B723a58739a9c974cFDB385ceaDb237453c28' } },
      '/add/0x462253b8F74B72304c145DB0e4Eebd326B22ca39': { page: '/add/[address]', query: { address: '0x462253b8F74B72304c145DB0e4Eebd326B22ca39' } },
      '/add/0x8101E6760130be2C8Ace79643AB73500571b7162': { page: '/add/[address]', query: { address: '0x8101E6760130be2C8Ace79643AB73500571b7162' } },
      '/add/0xF5194c3325202F456c95c1Cf0cA36f8475C1949F': { page: '/add/[address]', query: { address: '0xF5194c3325202F456c95c1Cf0cA36f8475C1949F' } },
      '/add/0xC85b385C8587219b1085A264f0235225644a5dD9': { page: '/add/[address]', query: { address: '0xC85b385C8587219b1085A264f0235225644a5dD9' } },
      '/add/0x174baa6b56ffe479b604CC20f22D09AD74F1Ca49': { page: '/add/[address]', query: { address: '0x174baa6b56ffe479b604CC20f22D09AD74F1Ca49' } },
      '/add/0xFD4D8a17df4C27c1dD245d153ccf4499e806C87D': { page: '/add/[address]', query: { address: '0xFD4D8a17df4C27c1dD245d153ccf4499e806C87D' } },
      '/add/0x055be5DDB7A925BfEF3417FC157f53CA77cA7222': { page: '/add/[address]', query: { address: '0x055be5DDB7A925BfEF3417FC157f53CA77cA7222' } },
      '/add/0x359FD5d6417aE3D8D6497d9B2e7A890798262BA4': { page: '/add/[address]', query: { address: '0x359FD5d6417aE3D8D6497d9B2e7A890798262BA4' } },
      '/add/0xd4B22fEdcA85E684919955061fDf353b9d38389b': { page: '/add/[address]', query: { address: '0xd4B22fEdcA85E684919955061fDf353b9d38389b' } },
      '/add/0x72E158d38dbd50A483501c24f792bDAAA3e7D55C': { page: '/add/[address]', query: { address: '0x72E158d38dbd50A483501c24f792bDAAA3e7D55C' } },
      '/add/0x9B8519A9a00100720CCdC8a120fBeD319cA47a14': { page: '/add/[address]', query: { address: '0x9B8519A9a00100720CCdC8a120fBeD319cA47a14' } },
      '/add/0x824F13f1a2F29cFEEa81154b46C0fc820677A637': { page: '/add/[address]', query: { address: '0x824F13f1a2F29cFEEa81154b46C0fc820677A637' } },
      '/add/0x9582C4ADACB3BCE56Fea3e590F05c3ca2fb9C477': { page: '/add/[address]', query: { address: '0x9582C4ADACB3BCE56Fea3e590F05c3ca2fb9C477' } },
      '/add/0xb9C05B8EE41FDCbd9956114B3aF15834FDEDCb54': { page: '/add/[address]', query: { address: '0xb9C05B8EE41FDCbd9956114B3aF15834FDEDCb54' } },
      '/add/0xfE1A3dD8b169fB5BF0D5dbFe813d956F39fF6310': { page: '/add/[address]', query: { address: '0xfE1A3dD8b169fB5BF0D5dbFe813d956F39fF6310' } },
      '/add/0xC48f4653dd6a9509De44c92beb0604BEA3AEe714': { page: '/add/[address]', query: { address: '0xC48f4653dd6a9509De44c92beb0604BEA3AEe714' } },
      '/add/0x6955a55416a06839309018A8B0cB72c4DDC11f15': { page: '/add/[address]', query: { address: '0x6955a55416a06839309018A8B0cB72c4DDC11f15' } },
      '/add/0x488E6ef919C2bB9de535C634a80afb0114DA8F62': { page: '/add/[address]', query: { address: '0x488E6ef919C2bB9de535C634a80afb0114DA8F62' } },
      '/add/0xfDb129ea4b6f557b07BcDCedE54F665b7b6Bc281': { page: '/add/[address]', query: { address: '0xfDb129ea4b6f557b07BcDCedE54F665b7b6Bc281' } },
      '/add/0x060e386eCfBacf42Aa72171Af9EFe17b3993fC4F': { page: '/add/[address]', query: { address: '0x060e386eCfBacf42Aa72171Af9EFe17b3993fC4F' } },
      '/add/0x6C09F6727113543Fd061a721da512B7eFCDD0267': { page: '/add/[address]', query: { address: '0x6C09F6727113543Fd061a721da512B7eFCDD0267' } },
      '/add/0xDeFd8FdD20e0f34115C7018CCfb655796F6B2168': { page: '/add/[address]', query: { address: '0xDeFd8FdD20e0f34115C7018CCfb655796F6B2168' } },
      '/add/0xe8060Ad8971450E624d5289A10017dD30F5dA85F': { page: '/add/[address]', query: { address: '0xe8060Ad8971450E624d5289A10017dD30F5dA85F' } },
      '/add/0xd8b712d29381748dB89c36BCa0138d7c75866ddF': { page: '/add/[address]', query: { address: '0xd8b712d29381748dB89c36BCa0138d7c75866ddF' } }
    }
  }
}
