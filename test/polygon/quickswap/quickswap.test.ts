import { expect } from "chai";
import hre from "hardhat";
const { waffle, ethers } = hre;
const { provider } = waffle;

import { deployAndEnableConnector } from "../../../scripts/tests/deployAndEnableConnector";
import { buildDSAv2 } from "../../../scripts/tests/buildDSAv2";
import { encodeSpells } from "../../../scripts/tests/encodeSpells";
import { getMasterSigner } from "../../../scripts/tests/getMasterSigner";
import { addLiquidity } from "../../../scripts/tests/addLiquidity";

import { addresses } from "../../../scripts/tests/polygon/addresses";
import { abis } from "../../../scripts/constant/abis";
import { ConnectV2Quickswap__factory, ConnectV2Quickswap } from "../../../typechain";
import type { Signer, Contract } from "ethers";

const DAI_ADDR = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063";

describe("Quickswap", function() {
  const connectorName = "Quickpswap-v1.1";

  let dsaWallet0: Contract;
  let masterSigner: Signer;
  let instaConnectorsV2: Contract;
  let connector: Contract;

  const wallets = provider.getWallets();
  const [wallet0, wallet1, wallet2, wallet3] = wallets;
  before(async () => {
    await hre.network.provider.request({
        method: "hardhat_reset",
        params: [
            {
                forking: {
                    // @ts-ignore
                    jsonRpcUrl: hre.config.networks.hardhat.forking.url,
                    blockNumber: 13005785,
                },
            },
        ],
    });

    masterSigner = await getMasterSigner();
    instaConnectorsV2 = await ethers.getContractAt(
      abis.core.connectorsV2,
      addresses.core.connectorsV2
    );
    connector = await deployAndEnableConnector({
      connectorName,
      contractArtifact: ConnectV2Quickswap__factory,
      signer: masterSigner,
      connectors: instaConnectorsV2,
    });
    console.log("Connector address", connector.address);
  });

  it("Should have contracts deployed.", async function() {
    expect(!!instaConnectorsV2.address).to.be.true;
    expect(!!connector.address).to.be.true;
    expect(!!(await masterSigner.getAddress())).to.be.true;
  });

  describe("DSA wallet setup", function() {
    it("Should build DSA v2", async function() {
      dsaWallet0 = await buildDSAv2(wallet0.address);
      expect(!!dsaWallet0.address).to.be.true;
    });

    it("Deposit ETH & DAI into DSA wallet", async function() {
      await wallet0.sendTransaction({
        to: dsaWallet0.address,
        value: ethers.utils.parseEther("10"),
      });
      expect(await ethers.provider.getBalance(dsaWallet0.address)).to.be.gte(
        ethers.utils.parseEther("10")
      );

      await addLiquidity(
        "dai",
        dsaWallet0.address,
        ethers.utils.parseEther("100000")
      );
    });

    it("Deposit ETH & USDT into DSA wallet", async function() {
      await wallet0.sendTransaction({
        to: dsaWallet0.address,
        value: ethers.utils.parseEther("10"),
      });
      expect(await ethers.provider.getBalance(dsaWallet0.address)).to.be.gte(
        ethers.utils.parseEther("10")
      );

      await addLiquidity(
        "usdt",
        dsaWallet0.address,
        ethers.utils.parseEther("100000")
      );
    });
  });

  describe("Main", function() {
    it("Should deposit successfully", async function() {
      const ethAmount = ethers.utils.parseEther("100"); // 1 ETH
      const daiUnitAmount = ethers.utils.parseUnits("4", 6); // 1 ETH
      const usdtAmount = Number(ethers.utils.parseEther("400")) / Math.pow(10, 12); // 1 ETH
      const ethAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

      const getId = "0";
      const setId = "0";

      const spells = [
        {
          connector: connectorName,
          method: "deposit",
          args: [
            ethAddress,
            DAI_ADDR,
            ethAmount,
            daiUnitAmount,
            "500000000000000000",
            getId,
            setId,
          ],
        },
      ];

      const tx = await dsaWallet0
        .connect(wallet0)
        .cast(...encodeSpells(spells), wallet1.address);
      let receipt = await tx.wait();
    }).timeout(10000000000);

    it("Should withdraw successfully", async function() {
      const ethAmount = ethers.utils.parseEther("0.1"); // 1 ETH
      const ethAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

      const getId = "0";
      const setIds = ["0", "0"];

      const spells = [
        {
          connector: connectorName,
          method: "withdraw",
          args: [ethAddress, DAI_ADDR, ethAmount, 0, 0, getId, setIds],
        },
      ];

      const tx = await dsaWallet0
        .connect(wallet0)
        .cast(...encodeSpells(spells), wallet1.address);
      let receipt = await tx.wait();
    });

    it("Should buy successfully", async function() {
      const ethAmount = ethers.utils.parseEther("0.1"); // 1 ETH
      const daiUnitAmount = ethers.utils.parseEther("4000"); // 1 ETH
      const ethAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

      const getId = "0";
      const setId = "0";

      const spells = [
        {
          connector: connectorName,
          method: "buy",
          args: [ethAddress, DAI_ADDR, ethAmount, daiUnitAmount, getId, setId],
        },
      ];

      const tx = await dsaWallet0
        .connect(wallet0)
        .cast(...encodeSpells(spells), wallet1.address);
      let receipt = await tx.wait();
    });
  });
});
