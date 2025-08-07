"use client";
import React, { useMemo, useState, useEffect } from "react";
import { Brain, Cog, FileText, BarChart2, Mail, Download, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const ORG_NAME = "Diversicom";
const CTA_URL = "https://www.diversicomcorp.com/contact/"; // fallback CTA
const WEBHOOK_URL = ""; // Set to Zapier/HubSpot/PSA endpoint to enable emailing.

type CategoryKey = "automation" | "data" | "people" | "risk";
type Question = { id: string; text: string; helper?: string; category: CategoryKey; weight: number; };
type Answers = Record<string, number>;

const QUESTIONS: Question[] = [
  { id: "repetitive_tasks", text: "Teams spend time on repetitive digital tasks (copy/paste, renaming files, routing emails).", helper: "Think back-office, helpdesk triage, report formatting, content prep.", category: "automation", weight: 1.2 },
  { id: "ticket_volume", text: "We handle many inbound tickets/emails/chats with recurring themes/questions.", category: "automation", weight: 1.1 },
  { id: "document_intake", text: "We manually process documents (invoices, PDFs, forms) and re-key data.", category: "automation", weight: 1.25 },
  { id: "approvals", text: "Approvals (POs, access, exceptions) are manual, slow, or inconsistent.", category: "automation", weight: 0.9 },
  { id: "data_sources", text: "We know where our key data lives and can access it (PSA, ERP, CRM, file shares).", category: "data", weight: 1.0 },
  { id: "kb_quality", text: "We have a usable knowledge base / SOPs (even if imperfect).", category: "data", weight: 0.9 },
  { id: "data_quality", text: "Our data is reasonably clean and structured (naming, owners, duplicates).", category: "data", weight: 1.2 },
  { id: "exec_sponsor", text: "We have an executive sponsor who wants AI-enabled efficiency gains.", category: "people", weight: 1.1 },
  { id: "champions", text: "We have team champions who can test new workflows and give feedback.", category: "people", weight: 1.0 },
  { id: "training_budget", text: "We can allocate a small budget/time for training and change management.", category: "people", weight: 0.9 },
  { id: "security_basics", text: "Security basics are in place (MFA, least privilege, EDR, email security).", category: "risk", weight: 1.0 },
  { id: "compliance_req", text: "We have compliance requirements (HIPAA/PCI/FINRA) that shape AI usage.", helper: "Higher score = clearer governance; lower = unknowns or blockers.", category: "risk", weight: 0.8 },
  { id: "data_handling", text: "We can keep sensitive data out of consumer AI tools (policies/controls).", category: "risk", weight: 1.1 },
];

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  automation: "Automation Potential",
  data: "Data Readiness",
  people: "Change Readiness",
  risk: "Risk & Governance",
};

const MAX_SCORE = 5;

function inferInitiatives(ans: Answers) {
  type Initiative = { id: string; title: string; description: string; pillar: "DataConnect" | "Insight360" | "PredictIQ" | "Cyber+" | "vCISO" | "SafeGuard" | "CoreIT"; impact: number; estHoursSavedPerMonth: number; };
  const get = (k: string) => ans[k] ?? 0;
  const baseImpact = (k: string, mult = 20) => Math.round(get(k) * mult);
  const initiatives: Initiative[] = [];

  if (get("ticket_volume") >= 2 || get("repetitive_tasks") >= 3) {
    initiatives.push({
      id: "triage",
      title: "Inbox & Ticket Triage Copilot",
      description: "Auto-classify, route, and draft first responses for common requests; surface KB answers inline.",
      pillar: "Insight360",
      impact: baseImpact("ticket_volume", 18) + baseImpact("kb_quality", 8),
      estHoursSavedPerMonth: 8 * (get("ticket_volume") + get("kb_quality")),
    });
  }
  if (get("document_intake") >= 2 || get("data_quality") >= 2) {
    initiatives.push({
      id: "doc-intake",
      title: "Document Intake & Data Extraction",
      description: "Parse invoices/forms/PDFs to structured data with validation and ERP/PSA handoff.",
      pillar: "Insight360",
      impact: baseImpact("document_intake", 20) + baseImpact("data_quality", 10),
      estHoursSavedPerMonth: 6 * (get("document_intake") + get("data_quality")),
    });
  }
  if (get("approvals") >= 2 && get("exec_sponsor") >= 2) {
    initiatives.push({
      id: "approvals",
      title: "AI-Assisted Approvals & Exceptions",
      description: "Policy-aware summaries and risk flags speed up PO/access approvals with audit trails.",
      pillar: "Insight360",
      impact: baseImpact("approvals", 18) + baseImpact("security_basics", 6),
      estHoursSavedPerMonth: 5 * (get("approvals") + get("security_basics")),
    });
  }
  if (get("kb_quality") >= 1 && get("ticket_volume") >= 2) {
    initiatives.push({
      id: "kb-copilot",
      title: "Knowledge Base Q&A Copilot",
      description: "Ask natural-language questions across SOPs and policies; cite sources & links.",
      pillar: "Insight360",
      impact: baseImpact("kb_quality", 12) + baseImpact("ticket_volume", 14),
      estHoursSavedPerMonth: 5 * (get("kb_quality") + get("ticket_volume")),
    });
  }
  if (get("data_sources") >= 2 && get("data_quality") >= 2) {
    initiatives.push({
      id: "predict",
      title: "Predictive KPIs & Anomaly Alerts",
      description: "Blend PSA/ERP/CRM to forecast demand, detect churn/drift, and flag bottlenecks.",
      pillar: "PredictIQ",
      impact: baseImpact("data_sources", 12) + baseImpact("data_quality", 16),
      estHoursSavedPerMonth: 4 * (get("data_sources") + get("data_quality")),
    });
  }
  if (get("security_basics") <= 2 || get("data_handling") <= 2) {
    initiatives.push({
      id: "policy",
      title: "AI Usage Policy & Guardrails",
      description: "Define safe prompts/data handling, enable enterprise controls, and monitor usage.",
      pillar: "vCISO",
      impact: (3 - Math.min(get("security_basics"), 3)) * 25 + (3 - Math.min(get("data_handling"), 3)) * 20,
      estHoursSavedPerMonth: 3 * (3 - Math.min(get("data_handling"), 3)),
    });
  }
  return initiatives.map(i => ({ ...i, impact: Math.min(100, Math.max(5, i.impact))})).sort((a,b)=>b.impact-a.impact).slice(0,6);
}

function clamp(n:number,min=0,max=100){return Math.min(max,Math.max(min,n));}
function pct(n:number){return `${Math.round(n)}%`;}

export default function Page() {
  const [answers, setAnswers] = useState<Answers>({});
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [teamSize, setTeamSize] = useState<number | "">("");
  const [hoursPerPersonWeek, setHoursPerPersonWeek] = useState<number | "">("");
  const [hourlyRate, setHourlyRate] = useState<number | "">("");
  const [subscribe, setSubscribe] = useState(true);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(()=>{
    try{
      const raw = localStorage.getItem("ai-readiness-finder");
      if(raw){
        const v = JSON.parse(raw);
        setAnswers(v.answers ?? {});
        setCompany(v.company ?? "");
        setEmail(v.email ?? "");
        setTeamSize(v.teamSize ?? "");
        setHoursPerPersonWeek(v.hoursPerPersonWeek ?? "");
        setHourlyRate(v.hourlyRate ?? "");
        setSubscribe(v.subscribe ?? true);
        setNote(v.note ?? "");
      }
    }catch{}
  },[]);

  useEffect(()=>{
    try{
      localStorage.setItem("ai-readiness-finder", JSON.stringify({
        answers, company, email, teamSize, hoursPerPersonWeek, hourlyRate, subscribe, note
      }));
    }catch{}
  },[answers, company, email, teamSize, hoursPerPersonWeek, hourlyRate, subscribe, note]);

  const { categoryScores, overall } = useMemo(()=>{
    const byCat: Record<CategoryKey, {score:number; weight:number}> = {
      automation:{score:0,weight:0},
      data:{score:0,weight:0},
      people:{score:0,weight:0},
      risk:{score:0,weight:0},
    };
    const MAX = 5;
    QUESTIONS.forEach(q=>{
      const v = answers[q.id] ?? 0;
      byCat[q.category].score += (v / MAX) * q.weight;
      byCat[q.category].weight += q.weight;
    });
    const catPct: Record<CategoryKey, number> = {
      automation: byCat.automation.weight ? (byCat.automation.score / byCat.automation.weight) * 100 : 0,
      data: byCat.data.weight ? (byCat.data.score / byCat.data.weight) * 100 : 0,
      people: byCat.people.weight ? (byCat.people.score / byCat.people.weight) * 100 : 0,
      risk: byCat.risk.weight ? (byCat.risk.score / byCat.risk.weight) * 100 : 0,
    };
    const overall = (catPct.automation * 0.35 + catPct.data * 0.3 + catPct.people * 0.2 + catPct.risk * 0.15);
    return { categoryScores: catPct, overall };
  },[answers]);

  const initiatives = useMemo(()=>inferInitiatives(answers),[answers]);

  const roi = useMemo(()=>{
    const ts = typeof teamSize === "number" ? teamSize : parseFloat(String(teamSize));
    const hppw = typeof hoursPerPersonWeek === "number" ? hoursPerPersonWeek : parseFloat(String(hoursPerPersonWeek));
    const rate = typeof hourlyRate === "number" ? hourlyRate : parseFloat(String(hourlyRate));
    if(!ts || !hppw || !rate) return null;
    const baselineHrs = ts * hppw * 4.3;
    const automationYield = (overall / 100) * 0.6 * 0.9;
    const hoursSaved = baselineHrs * automationYield;
    const cashSaved = hoursSaved * rate;
    return {
      baselineHrs: Math.round(baselineHrs),
      automationYield: clamp(automationYield * 100),
      hoursSaved: Math.round(hoursSaved),
      cashSaved: Math.round(cashSaved),
    };
  },[teamSize, hoursPerPersonWeek, hourlyRate, overall]);

  const chartData = useMemo(()=> (Object.keys(CATEGORY_LABELS) as CategoryKey[]).map(k=>({name:CATEGORY_LABELS[k], score: Math.round((categoryScores[k] || 0))})), [categoryScores]);

  async function handleSubmit(){
    if(!WEBHOOK_URL){ setSubmitted(true); return; }
    setSubmitting(True);
    try{
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          org: ORG_NAME, company, email, subscribe, answers, categoryScores, overall, initiatives, roi, note, createdAt: new Date().toISOString(), source: "ai-readiness-finder"
        })
      });
      setSubmitted(true);
    }catch(e){ console.error(e); setSubmitted(true); }
    finally{ setSubmitting(false); }
  }

  function resetAll(){
    setAnswers({}); setCompany(""); setEmail(""); setTeamSize(""); setHoursPerPersonWeek(""); setHourlyRate(""); setSubscribe(true); setNote(""); setSubmitted(false);
  }

  return (
    <div className="mx-auto max-w-5xl p-6 print:p-0">
      <div className="mb-6 flex items-center gap-3 print:hidden">
        <Sparkles className="h-6 w-6" />
        <h1 className="text-2xl font-semibold">{ORG_NAME} • AI Readiness Finder</h1>
      </div>

      {/* Survey */}
      <div className="mb-6 rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="flex items-center gap-2 text-lg font-semibold"><Brain className="h-5 w-5"/> Quick Readiness Survey</div>
          <p className="text-sm text-gray-500">Rate each statement from 0 (not true) to 5 (very true) for your org today.</p>
        </div>
        <div className="p-5 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            {QUESTIONS.map(q => (
              <div key={q.id} className="rounded-2xl border p-4">
                <div className="mb-1 text-sm font-medium">{q.text}</div>
                {q.helper && <div className="mb-2 text-xs text-gray-500">{q.helper}</div>}
                <div className="flex items-center gap-2">
                  <span className="text-xs">0</span>
                  <input type="range" min={0} max={5} step={1} value={answers[q.id] ?? 0} onChange={(e)=>setAnswers(prev=>({...prev, [q.id]: parseInt(e.target.value)}))} className="w-full" />
                  <span className="text-xs">5</span>
                  <div className="w-8 text-right text-xs font-semibold">{answers[q.id] ?? 0}</div>
                </div>
                <div className="mt-3 text-xs text-gray-500">{CATEGORY_LABELS[q.category]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t p-4">
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall readiness</span>
              <span className="font-semibold">{pct(overall)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div className={"h-2 rounded-full"} style={{ width: pct(overall), backgroundColor: overall>=75? '#22c55e' : overall>=50 ? '#eab308' : '#ef4444' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Category chart & ROI */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-lg font-semibold"><BarChart2 className="h-5 w-5"/> Category scores</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v:number)=> `${Math.round(Number(v))}%`} />
                <Bar dataKey="score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-2 text-lg font-semibold"><Cog className="h-5 w-5"/> ROI inputs</div>
          <p className="mb-3 text-sm text-gray-500">Optional but recommended for a tailored business case.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Team size affected</label>
              <input type="number" placeholder="e.g., 10" value={teamSize} onChange={(e)=>setTeamSize(e.target.value === "" ? "" : parseInt(e.target.value))} min={1} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Hours per person / week (repetitive work)</label>
              <input type="number" placeholder="e.g., 5" value={hoursPerPersonWeek} onChange={(e)=>setHoursPerPersonWeek(e.target.value === "" ? "" : parseFloat(e.target.value))} min={0} step={0.5} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Fully loaded hourly rate (USD)</label>
              <input type="number" placeholder="e.g., 60" value={hourlyRate} onChange={(e)=>setHourlyRate(e.target.value === "" ? "" : parseFloat(e.target.value))} min={0} step={1} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Company (optional)</label>
              <input placeholder="Acme Corp" value={company} onChange={(e)=>setCompany(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium">Context / priorities (optional)</label>
            <textarea placeholder="Share any goals, systems (PSA/ERP/CRM), or constraints to tailor recommendations." value={note} onChange={(e)=>setNote(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
        </div>
      </div>

      {/* Initiatives */}
      <div className="mt-6 rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="flex items-center gap-2 text-lg font-semibold"><FileText className="h-5 w-5"/> Recommended initiatives</div>
          <p className="text-sm text-gray-500">Prioritized based on your inputs. These map to {ORG_NAME}'s Illuminate pillar (DataConnect → Insight360 → PredictIQ) and security services where needed.</p>
        </div>
        <div className="p-4 space-y-4">
          {Object.keys(answers).length === 0 ? (
            <div className="text-sm text-gray-500">Answer a few questions above to see tailored recommendations.</div>
          ) : (
            inferInitiatives(answers).map((i, idx)=>(
              <div key={i.id} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Priority #{idx + 1}</div>
                    <div className="text-lg font-semibold">{i.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Impact</div>
                    <div className="text-base font-semibold">{i.impact}</div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">{i.description}</div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-gray-100 p-3">
                    <div className="text-xs text-gray-500">Mapped offering</div>
                    <div className="font-medium">{i.pillar}</div>
                  </div>
                  <div className="rounded-xl bg-gray-100 p-3">
                    <div className="text-xs text-gray-500">Est. hours saved / month</div>
                    <div className="font-medium">{Math.max(2, i.estHoursSavedPerMonth)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Business case */}
      <div className="mt-6 rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="flex items-center gap-2 text-lg font-semibold"><BarChart2 className="h-5 w-5"/> Business case</div>
          <p className="text-sm text-gray-500">Estimate savings to justify a pilot.</p>
        </div>
        <div className="p-4">
          {!roi ? (
            <div className="text-sm text-gray-500">Fill in team size, hours/week, and hourly rate to see projected savings.</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-gray-500">Baseline repetitive hours / month</div>
                <div className="text-2xl font-semibold">{roi.baselineHrs}</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-gray-500">Automation yield (at current readiness)</div>
                <div className="text-2xl font-semibold">{pct(roi.automationYield)}</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-gray-500">Projected hours saved / month</div>
                <div className="text-2xl font-semibold">{roi.hoursSaved}</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-gray-500">Projected savings / month</div>
                <div className="text-2xl font-semibold">${(roi.cashSaved).toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 border-t p-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-600">Next step: schedule a 30‑minute walkthrough to turn the top 2 initiatives into a 2‑week pilot.</div>
          <div className="flex gap-2 print:hidden">
            <button className="rounded-lg border px-4 py-2" onClick={()=>window.print()}>
              <span className="inline-flex items-center gap-2"><Download className="h-4 w-4" /> Download PDF</span>
            </button>
            <a className="rounded-lg bg-black px-4 py-2 text-white" href={CTA_URL} target="_blank" rel="noreferrer">Book a consult</a>
          </div>
        </div>
      </div>

      {/* Email report */}
      <div className="mt-6 rounded-2xl border bg-white shadow-sm print:hidden">
        <div className="border-b p-4">
          <div className="flex items-center gap-2 text-lg font-semibold"><Mail className="h-5 w-5"/> Email my report</div>
          <p className="text-sm text-gray-500">Get a copy of your results and a tailored plan from {ORG_NAME}.</p>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium">Email</label>
            <input type="email" placeholder="you@company.com" value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <input id="subscribe" type="checkbox" checked={subscribe} onChange={(e)=>setSubscribe(e.target.checked)} />
            <label htmlFor="subscribe" className="text-sm">Keep me updated on practical AI tips (no spam)</label>
          </div>
          <div className="md:col-span-3 flex gap-2">
            <button className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50" disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Sending..." : WEBHOOK_URL ? "Email me my report" : "Save locally (no email set)"}
            </button>
            <button className="rounded-lg border px-4 py-2" onClick={resetAll}>Reset</button>
          </div>
          {submitted && (
            <div className="md:col-span-3 text-sm text-green-700">
              {WEBHOOK_URL ? "Thanks! We’ll send your report shortly." : "Saved locally. Set WEBHOOK_URL to enable emailing via Zapier/HubSpot/PSA."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
