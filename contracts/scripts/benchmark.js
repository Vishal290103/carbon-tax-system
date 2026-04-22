const { ethers } = require("hardhat");

async function main() {
  const [owner, govt, mfg, buyer] = await ethers.getSigners();

  const CarbonTaxSystem = await ethers.getContractFactory("CarbonTaxSystem");
  const ctt = await CarbonTaxSystem.deploy(govt.address);
  await ctt.waitForDeployment();

  // --- Add product (manufacturer) ---
  const basePrice = ethers.parseEther("0.01"); // 0.01 ETH
  const emission = 250; // grams CO2 metadata
  let t0 = Date.now();
  const tx1 = await ctt.connect(mfg).addProduct("DemoProduct", basePrice, emission);
  const r1 = await tx1.wait();
  let t1 = Date.now();

  // productCounter is 1 after first add
  const productId = 1n;
  const prod = await ctt.products(productId);
  const totalAmount = prod.basePrice + prod.carbonTax;

  // --- Purchase product (buyer) ---
  let t2 = Date.now();
  const tx2 = await ctt.connect(buyer).purchaseProduct(productId, { value: totalAmount });
  const r2 = await tx2.wait();
  let t3 = Date.now();

  // --- Buy tokens + stake (buyer becomes validator) ---
  // Buy tokens to meet MIN_STAKE
  const buyEth = ethers.parseEther("2"); // should mint 2000 CTT at 1000 CTT/ETH
  let t4 = Date.now();
  const tx3 = await ctt.connect(buyer).buyTokensWithETH({ value: buyEth });
  const r3 = await tx3.wait();
  let t5 = Date.now();

  // Stake MIN_STAKE (1000 CTT)
  const minStake = await ctt.MIN_STAKE();
  // CTT is ERC20; staking uses _transfer, so buyer must hold tokens (they do from mint)
  let t6 = Date.now();
  const tx4 = await ctt.connect(buyer).stakeTokens(minStake);
  const r4 = await tx4.wait();
  let t7 = Date.now();

  // --- Government creates green project ---
  let t8 = Date.now();
  const tx5 = await ctt.connect(govt).createGreenProject(
    "Tree Plantation", "Mumbai", "Afforestation", ethers.parseEther("1"), 1000
  );
  const r5 = await tx5.wait();
  let t9 = Date.now();

  // --- Government funds green project (send 0.1 ETH) ---
  const projectId = 1n;
  let t10 = Date.now();
  const tx6 = await ctt.connect(govt).fundGreenProject(projectId, { value: ethers.parseEther("0.1") });
  const r6 = await tx6.wait();
  let t11 = Date.now();

  const out = [
    { op: "addProduct", gasUsed: r1.gasUsed.toString(), latencyMs: (t1 - t0) },
    { op: "purchaseProduct", gasUsed: r2.gasUsed.toString(), latencyMs: (t3 - t2) },
    { op: "buyTokensWithETH", gasUsed: r3.gasUsed.toString(), latencyMs: (t5 - t4) },
    { op: "stakeTokens", gasUsed: r4.gasUsed.toString(), latencyMs: (t7 - t6) },
    { op: "createGreenProject", gasUsed: r5.gasUsed.toString(), latencyMs: (t9 - t8) },
    { op: "fundGreenProject", gasUsed: r6.gasUsed.toString(), latencyMs: (t11 - t10) },
  ];

  console.table(out);

  // sanity stats
  const stats = await ctt.getSystemStats();
  console.log("System stats:", {
    totalTaxCollected: stats[0].toString(),
    totalFundsAllocated: stats[1].toString(),
    products: stats[2].toString(),
    projects: stats[3].toString(),
    validators: stats[4].toString(),
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
