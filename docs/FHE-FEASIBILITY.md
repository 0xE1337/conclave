# AG4 × Zama FHE 可行性分析报告

> 日期：2026-04-13 · 基于 AG4 v0.3.2 (tag) + Zama fhEVM v0.12.0
> 目标：Zama Developer Program Mainnet Season 2 — Track 3 (APAC Special)
> 截止：2026-05-10 · 奖金：5 × 1,000 cUSDT

---

## 一、融合方案：FHE Confidential Agent Credit Protocol

**一句话**：AI Agent 经济体的隐私金融基础设施——agent 在加密状态下积累信誉、获得差异化金融服务，全程零数据泄露。

**杀手锏叙事**：别人做人的 DeFi 隐私，我们做 **Agent 的 DeFi 隐私**。Agent 经济体需要信用评分，但 agent 的行为数据不能公开——FHE 让 agent 在加密状态下积累信誉。

---

## 二、AG4 模块与 FHE 的交叉点分析

### 2.1 CitizenRegistry — 哪些属性适合加密

| 字段 | 原始类型 | FHE 类型 | 是否加密 | 理由 |
|------|---------|----------|---------|------|
| `principalCommitment` | bytes32 | — | 不需要 | 已是 hash，不可逆 |
| `popTier` | uint8 | `euint8` | **加密** | 隐藏认证等级，防按等级歧视 |
| `status` | uint8 | — | **公开** | 其他合约 require(status==Active) 需要明文 |
| `principalAccount` | address | `eaddress` | **加密** | 隐藏控制人——AG4 最大隐私痛点 |
| `registeredAt` | uint256 | — | **公开** | MIN_BOND_AGE 30天比较需要明文时间戳 |
| `bondAmount` | uint256 | `euint64` | **加密** | 隐藏质押金额，防竞争对手窥探 |

### 2.2 ReputationScoring — FHE 兼容的线性简化

AG4 当前公式（非 FHE 兼容）：
```
weight = sqrt(bond) × min(1, age/30) × (1 + 0.1×log2(jobs+1) - 0.5×slashes/total) × e^(-0.023×idle)
```

FHE 兼容的线性版本（只用 add/sub/mul）：
```
score = w1 × completed_tasks - w2 × disputes_lost + w3 × volume_tier
```

其中 `volume_tier` 用分段线性近似替代 `sqrt(bond)`：
```
bond < 1000   → tier = bond
bond < 10000  → tier = 1000 + (bond - 1000) / 2
bond >= 10000 → tier = 5500 + (bond - 10000) / 4
```

三段都可用 `TFHE.select()` + `TFHE.add()` + `TFHE.div()` 实现。

### 2.3 IZKVoting → FHE 投票替代

| 维度 | CommitReveal (当前) | ZK (预留) | FHE (Zama) |
|------|-------------------|-----------|------------|
| 投票隐私 | 弱（reveal 后公开） | 强 | **强（密文计票）** |
| 计票 | 链下统计 | 链下 prove | **链上密文直接 add** |
| 抗贿赂 | 弱（reveal 可证明） | 强 | **强（无法证明投了什么）** |
| 复杂度 | 低 | 高（电路） | **中（Solidity）** |

FHE 投票实现核心：
```solidity
function castEncryptedVote(uint256 jobId, einput encVote, bytes calldata proof) external {
    ebool vote = TFHE.asEbool(encVote, proof);
    rounds[jobId].approveCount = TFHE.add(
        rounds[jobId].approveCount,
        TFHE.select(vote, TFHE.asEuint32(1), TFHE.asEuint32(0))
    );
}

function tallyResult(uint256 jobId) external returns (uint256 approve, uint256 reject) {
    // 窗口结束后门限解密一次性公开
    return TFHE.decrypt(rounds[jobId].approveCount);
}
```

### 2.4 StreamingEscrow → ConfidentialEscrow

金额用 euint64，只有 client/provider/evaluator 三方可见：
```solidity
function createConfidentialStream(
    address provider, address evaluator,
    einput encryptedAmount, bytes calldata inputProof,
    uint256 duration
) external {
    euint64 amount = TFHE.asEuint64(encryptedAmount, inputProof);
    TFHE.allow(amount, msg.sender);   // client
    TFHE.allow(amount, provider);
    TFHE.allow(amount, evaluator);
}
```

### 2.5 principalCommitment → FHE 属性验证

不存 hash，存加密属性，做不暴露值的条件验证：
```solidity
function meetsThreshold(uint256 agentId, euint8 minTier) external returns (ebool) {
    return TFHE.ge(principals[agentId].encryptedPopTier, minTier);
    // 返回加密 bool——调用方不知道具体 tier
}
```

---

## 三、AG4 稳定接口（可直接对齐）

| 接口 | 稳定性 | 函数签名 |
|------|--------|---------|
| `IZKVoting.sol` | **稳定** | `castEncryptedVote(jobId, proof)` + `tallyResult(jobId)` |
| `CitizenRegistry.registerCitizenAttested()` | **稳定** (H1 冻结) | EIP-712 签名 |
| `AG4Commerce.createJob/submitJob/finalize` | **稳定** (UFX fork 冻结) | job lifecycle 四步 |
| `JurorPoolEvaluator.castVote()` | **稳定** (S4 以来未改) | `(jobId, success)` |
| `StreamingEscrow.*` | **S10 新增，可能微调** | 对齐概念不锁参数 |

---

## 四、Bounty 交付架构（3 层）

```
Layer 1: AgentRegistry（精简 AG4 CitizenRegistry）
├── 注册 agent，身份可验证
└── 加密属性存储（popTier, bondAmount, principalAccount）

Layer 2: ConfidentialCreditEngine（FHE 核心）
├── 加密行为数据（euint32/64）
│   - encrypted_tasks_completed
│   - encrypted_disputes_lost
│   - encrypted_total_volume
├── FHE 同态计算信用分 = w1*completed - w2*disputes + w3*volume
└── ACL：只有 agent 授权的协议能读分数

Layer 3: ConfidentialFinanceServices
├── 差异化抵押率借贷（信用高 → 抵押率低）
├── 加密托管（agent 间交易金额隐藏）
└── 信用门槛准入（不暴露分数，只证明 >= 阈值）
```

---

## 五、Bounty 流程抽象（AG4 四步模式 → FHE 版）

```
1. POST   — createJob(provider, budget)         → 信用 +0
2. SUBMIT — submitJob(deliverable)               → encrypted_completed++
3. EVAL   — castEncryptedVote(approve/reject)    → 密文计票
4. SETTLE — finalize → payout 或 reject          → encrypted_volume++ 或 encrypted_disputes++
```

每一步在加密状态下更新信用分，全程零明文泄露。

---

## 六、时间线与分工

| 日期 | 里程碑 | 输出 |
|------|--------|------|
| 4.13-4.18 | 合约框架 | AgentRegistry + ConfidentialCreditScore + ConfidentialLending |
| 4.18-4.20 | FHE 投票模块 | ConfidentialVoting（实现 IZKVoting 接口） |
| 4.21-4.27 | Sepolia 部署 + 前端 | React dApp + 加密交互 |
| 4.28-5.4 | E2E 演示 | 完整流程：注册→积累信用→借贷→投票 |
| 5.5-5.10 | 文档 + 视频 + 提交 | 2 分钟演示视频 + README |

---

## 七、差异化竞争力

| 维度 | 纯 DeFi 方案 | AG4 × FHE 方案 |
|------|-------------|---------------|
| 叙事 | "人的隐私转账" | **"Agent 的隐私信用体系"** |
| 技术 | 加密余额/转账 | 加密信用分 + 加密投票 + 加密托管 |
| 创新度 | 低（借贷赛道拥挤 10+ 项目） | **高（Agent+FHE 几乎空白）** |
| 背书 | 无 | AG4 的治理研究 + Agent 经济体深度 |
| 可扩展性 | 单一 DeFi 协议 | 插入 AG4 V1 的候选组件 |
