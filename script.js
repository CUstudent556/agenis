const employees = [
  {
    id: "EMP-104",
    name: "Aarav Singh",
    role: "Senior Security Engineer",
    region: "Bengaluru, India",
    wallet: "aztec1q...x2y8",
    privateSalary: "$6,420",
    threshold: "$5,000",
    annualBand: "$72k-$84k",
    taxStatus: "TDS withheld and remitted for March 2026",
    complianceStatus: "Above Karnataka labor floor and employment class minimum",
    verifier: "Mock bank API",
    employment: "Full-time",
  },
  {
    id: "EMP-127",
    name: "Meera Thomas",
    role: "Product Operations Lead",
    region: "Dubai, UAE",
    wallet: "aztec1q...f9n4",
    privateSalary: "$8,150",
    threshold: "$7,000",
    annualBand: "$96k-$108k",
    taxStatus: "Cross-border payroll classification verified",
    complianceStatus: "Benefit and leave obligations satisfied",
    verifier: "Landlord / consulate verifier",
    employment: "Remote employee",
  },
  {
    id: "EMP-138",
    name: "Nikhil Rao",
    role: "Growth Analyst",
    region: "Pune, India",
    wallet: "aztec1q...m7c1",
    privateSalary: "$4,980",
    threshold: "$4,500",
    annualBand: "$54k-$60k",
    taxStatus: "TDS calculation matches declared payroll class",
    complianceStatus: "Minimum wage proof satisfied for salaried analyst role",
    verifier: "NBFC loan portal",
    employment: "Full-time",
  },
];

const proofDefinitions = {
  income: (employee) => ({
    title: "Income proof",
    audience: "Bank / landlord",
    description:
      "This proof confirms the employee earns above a reusable threshold without exposing the exact salary or the rest of the payroll ledger.",
    claims: [
      `${employee.name} earns above ${employee.threshold} per month.`,
      `Employment class is verified as ${employee.employment.toLowerCase()}.`,
      "Proof is derived from a shielded payroll note and expires in 30 days.",
    ],
    verifier: employee.verifier,
    validity: "Valid for 30 days",
  }),
  tax: (employee) => ({
    title: "Tax proof",
    audience: "Tax authority",
    description:
      "The payroll circuit confirms that withholding logic executed correctly and that the authority can request the full tax packet without seeing public salary data.",
    claims: [
      employee.taxStatus,
      `Employee salary sits inside the declared annual compensation band ${employee.annualBand}.`,
      "Authority receives only the tax statement and remittance commitment relevant to filing.",
    ],
    verifier: "Regulator API gateway",
    validity: "Valid for filing period",
  }),
  compliance: (employee) => ({
    title: "Compliance proof",
    audience: "Labor department",
    description:
      "This attestation proves the employer met contractual and statutory wage conditions while keeping raw salary notes private on-chain.",
    claims: [
      employee.complianceStatus,
      "Payroll was executed on the scheduled date with no skipped transfer events.",
      "The note commitment passes minimum compensation and category checks.",
    ],
    verifier: "Labor compliance dashboard",
    validity: "Valid until next payroll run",
  }),
  audit: (employee) => ({
    title: "Audit access",
    audience: "Authorized auditor",
    description:
      "Auditors can unlock a broader payroll history only with the correct disclosure key, preserving privacy for everyone else by default.",
    claims: [
      `Expanded history is available for ${employee.id} under an auditor-only disclosure key.`,
      "Access includes payment timestamps, withholding events, and note integrity checks.",
      "This route is gated and not exposed to banks, peers, or the public chain.",
    ],
    verifier: "Auditor enclave",
    validity: "Session-scoped access",
  }),
};

const payrollStages = [
  {
    title: "Awaiting treasury confirmation",
    badge: "Funding",
    progress: 25,
    heroLabel: "Ready to initiate",
    proofSummaryTitle: "Disclosure surface stays minimal",
    proofSummaryText:
      "All employee balances remain shielded until the employer, employee, or authority requests a specific proof.",
    log: "Corporate wallet staged USDC in the payroll vault.",
  },
  {
    title: "Encrypting employee salary notes",
    badge: "Encrypting",
    progress: 50,
    heroLabel: "Salary notes encrypted",
    proofSummaryTitle: "Payout values are hidden on-chain",
    proofSummaryText:
      "Each employee allocation is transformed into a private note commitment before any transfer is visible to the network.",
    log: "Payroll circuit generated encrypted notes for all recipients.",
  },
  {
    title: "Dispatching shielded transfers",
    badge: "Paying",
    progress: 75,
    heroLabel: "Transfers in flight",
    proofSummaryTitle: "Settlement is separate from disclosure",
    proofSummaryText:
      "Funds reach employee wallets immediately, while salary amounts remain concealed from external observers.",
    log: "Shielded USDC transfers reached employee wallets in the active batch.",
  },
  {
    title: "Generating compliance and tax proofs",
    badge: "Complete",
    progress: 100,
    heroLabel: "Proofs issued",
    proofSummaryTitle: "Verifiable compliance without raw payroll exposure",
    proofSummaryText:
      "Tax, wage-floor, and income-threshold proofs are now shareable with the exact audience that needs them.",
    log: "Selective-disclosure proofs are available for employee, bank, and authority flows.",
  },
];

let selectedEmployeeId = employees[0].id;
let selectedProofType = "income";
let hrViewEnabled = false;
let currentStageIndex = 0;

const employeeList = document.getElementById("employeeList");
const selectedEmployeeCard = document.getElementById("selectedEmployeeCard");
const proofTypeRow = document.getElementById("proofTypeRow");
const proofPanelHeading = document.getElementById("proofPanelHeading");
const proofAudience = document.getElementById("proofAudience");
const proofHash = document.getElementById("proofHash");
const proofValidity = document.getElementById("proofValidity");
const proofTitle = document.getElementById("proofTitle");
const proofDescription = document.getElementById("proofDescription");
const proofClaims = document.getElementById("proofClaims");
const proofVerifier = document.getElementById("proofVerifier");
const hrToggle = document.getElementById("hrToggle");
const runCycleButton = document.getElementById("runCycleButton");
const shareProofButton = document.getElementById("shareProofButton");
const stageTitle = document.getElementById("stageTitle");
const stageBadge = document.getElementById("stageBadge");
const stageProgress = document.getElementById("stageProgress");
const proofPercent = document.getElementById("proofPercent");
const proofSummaryTitle = document.getElementById("proofSummaryTitle");
const proofSummaryText = document.getElementById("proofSummaryText");
const activityLog = document.getElementById("activityLog");
const heroStageLabel = document.getElementById("heroStageLabel");
const heroProgressFill = document.getElementById("heroProgressFill");
const heroTimeline = document.getElementById("heroTimeline");

function currentEmployee() {
  return employees.find((employee) => employee.id === selectedEmployeeId) || employees[0];
}

function shortHash(seed) {
  const compact = seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).padEnd(10, "0");
  return `proof_${compact}_${selectedProofType}_2026`;
}

function renderRoster() {
  employeeList.innerHTML = "";

  employees.forEach((employee) => {
    const article = document.createElement("article");
    article.className = `employee-card${employee.id === selectedEmployeeId ? " is-active" : ""}`;

    const salaryClass = hrViewEnabled ? "salary-pill" : "salary-pill is-private";
    const visibilityText = hrViewEnabled ? "HR-only view" : "Shielded value";

    article.innerHTML = `
      <button type="button" data-employee-id="${employee.id}" aria-pressed="${employee.id === selectedEmployeeId}">
        <div class="employee-top">
          <div>
            <strong>${employee.name}</strong>
            <p>${employee.role}</p>
          </div>
          <span class="${salaryClass}">${employee.privateSalary}</span>
        </div>
        <p>${employee.region}</p>
        <div class="employee-bottom">
          <span class="wallet-pill">${employee.wallet}</span>
          <span class="status-pill ${hrViewEnabled ? "status-live" : "status-muted"}">${visibilityText}</span>
        </div>
      </button>
    `;

    article.querySelector("button")?.addEventListener("click", () => {
      selectedEmployeeId = employee.id;
      renderRoster();
      renderSelectedEmployee();
      renderProofPanel();
      renderActivityLog();
    });

    employeeList.appendChild(article);
  });
}

function renderSelectedEmployee() {
  const employee = currentEmployee();
  const salaryHtml = hrViewEnabled
    ? `<span class="salary-pill">${employee.privateSalary}</span>`
    : `<span class="salary-pill is-private">${employee.privateSalary}</span>`;

  selectedEmployeeCard.innerHTML = `
    <div class="selected-employee-top">
      <div>
        <strong>${employee.name}</strong>
        <p>${employee.role} • ${employee.region}</p>
      </div>
      ${salaryHtml}
    </div>
    <div class="employee-bottom">
      <span class="wallet-pill">${employee.id}</span>
      <span class="status-pill">${employee.wallet}</span>
    </div>
  `;
}

function renderProofPanel() {
  const employee = currentEmployee();
  const proof = proofDefinitions[selectedProofType](employee);

  proofPanelHeading.textContent = `${proof.title} for selected employee`;
  proofAudience.textContent = proof.audience;
  proofHash.textContent = shortHash(employee.id);
  proofValidity.textContent = proof.validity;
  proofTitle.textContent = proof.title;
  proofDescription.textContent = proof.description;
  proofVerifier.textContent = proof.verifier;

  proofClaims.innerHTML = "";
  proof.claims.forEach((claim) => {
    const item = document.createElement("li");
    item.textContent = claim;
    proofClaims.appendChild(item);
  });

  proofTypeRow.querySelectorAll(".proof-type").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.proof === selectedProofType);
  });
}

function renderStage() {
  const stage = payrollStages[currentStageIndex];

  stageTitle.textContent = stage.title;
  stageBadge.textContent = stage.badge;
  stageProgress.style.width = `${stage.progress}%`;
  proofPercent.textContent = `${stage.progress}%`;
  proofSummaryTitle.textContent = stage.proofSummaryTitle;
  proofSummaryText.textContent = stage.proofSummaryText;
  heroStageLabel.textContent = stage.heroLabel;
  heroProgressFill.style.width = `${stage.progress}%`;

  const ringFill = `radial-gradient(circle, rgba(7, 17, 30, 1) 54%, transparent 56%), conic-gradient(#70f0d6 0 ${stage.progress}%, rgba(255, 255, 255, 0.08) ${stage.progress}% 100%)`;
  document.querySelector(".proof-ring-visual").style.background = ringFill;

  heroTimeline.querySelectorAll(".timeline-row").forEach((row, index) => {
    row.classList.toggle("is-active", index === currentStageIndex);
  });
}

function renderActivityLog() {
  const now = new Date();

  const events = payrollStages
    .slice(0, currentStageIndex + 1)
    .map((entry, index) => {
      const timestamp = new Date(now.getTime() - (currentStageIndex - index) * 12 * 60 * 1000);
      const time = timestamp.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return {
        title: entry.log,
        meta: `${time} IST • ${entry.badge}`,
      };
    })
    .reverse();

  if (currentStageIndex === payrollStages.length - 1) {
    events.unshift({
      title: `Selected ${selectedProofType} proof prepared for ${currentEmployee().name}.`,
      meta: `${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST • Ready to share`,
    });
  }

  activityLog.innerHTML = "";
  events.forEach((event) => {
    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `<strong>${event.title}</strong><span>${event.meta}</span>`;
    activityLog.appendChild(item);
  });
}

function attachProofTypeHandlers() {
  proofTypeRow.querySelectorAll(".proof-type").forEach((button) => {
    button.addEventListener("click", () => {
      selectedProofType = button.dataset.proof || "income";
      renderProofPanel();
      renderActivityLog();
    });
  });
}

function attachControls() {
  hrToggle.addEventListener("change", (event) => {
    hrViewEnabled = Boolean(event.target.checked);
    renderRoster();
    renderSelectedEmployee();
  });

  runCycleButton.addEventListener("click", () => {
    currentStageIndex = (currentStageIndex + 1) % payrollStages.length;
    renderStage();
    renderActivityLog();
  });

  shareProofButton.addEventListener("click", () => {
    currentStageIndex = payrollStages.length - 1;
    renderStage();
    renderActivityLog();
    shareProofButton.textContent = `${proofDefinitions[selectedProofType](currentEmployee()).title} shared`;

    window.setTimeout(() => {
      shareProofButton.textContent = "Share selected proof";
    }, 2200);
  });
}

function attachRevealAnimations() {
  const revealNodes = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealNodes.forEach((node) => observer.observe(node));
}

function init() {
  renderRoster();
  renderSelectedEmployee();
  renderProofPanel();
  renderStage();
  renderActivityLog();
  attachProofTypeHandlers();
  attachControls();
  attachRevealAnimations();
}

init();
