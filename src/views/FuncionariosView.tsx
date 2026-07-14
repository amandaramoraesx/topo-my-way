import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  salary: number;
  active: boolean;
  work_hours_per_day: number;
  saturday_holiday_rate: number;
}

interface TimeRecord {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  lunch_out: string | null;
  lunch_in: string | null;
  notes: string | null;
}

interface Payment {
  id: string;
  employee_id: string;
  amount: number;
  date: string;
  description: string | null;
  payment_type: string;
}

export default function FuncionariosView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"cadastro" | "ponto" | "pagamentos" | "horas-extras">("cadastro");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [empName, setEmpName] = useState("");
  const [empRole, setEmpRole] = useState("Funcionário");
  const [empPhone, setEmpPhone] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empSalary, setEmpSalary] = useState("");
  const [empWorkHours, setEmpWorkHours] = useState("4");
  const [empDailyRate, setEmpDailyRate] = useState("100");

  const [selEmployee, setSelEmployee] = useState("");
  const [pontoNotes, setPontoNotes] = useState("");

  const [payEmployee, setPayEmployee] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payDesc, setPayDesc] = useState("");
  const [payType, setPayType] = useState("salario");
  const [horasFilterEmployee, setHorasFilterEmployee] = useState("");
  const [horasMonth, setHorasMonth] = useState(new Date().toISOString().slice(0, 7));

  const [payrollEmployee, setPayrollEmployee] = useState("");
  const [payrollRefDate, setPayrollRefDate] = useState(new Date().toISOString().slice(0, 10));
  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [empRes, trRes, payRes] = await Promise.all([
      supabase.from("employees").select("*").eq("active", true).order("name"),
      supabase.from("time_records").select("*").order("date", { ascending: false }).limit(100),
      supabase.from("employee_payments").select("*").order("date", { ascending: false }).limit(100),
    ]);
    setEmployees((empRes.data as any[]) || []);
    setTimeRecords((trRes.data as any[]) || []);
    setPayments((payRes.data as any[]) || []);
    setLoading(false);
  }

  function parseLocalizedNumber(value: string): number {
    if (!value || value.trim() === "") return 0;
    let str = value.trim().replace(/[R$\s]/g, "");
    const lastComma = str.lastIndexOf(",");
    const lastDot = str.lastIndexOf(".");
    if (lastComma > lastDot) {
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      str = str.replace(/,/g, "");
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  }

  async function addEmployee() {
    if (!empName || !user) return;
    const { error } = await supabase.from("employees").insert({
      user_id: user.id,
      name: empName,
      role: empRole,
      phone: empPhone,
      email: empEmail,
      salary: parseLocalizedNumber(empSalary),
      work_hours_per_day: parseLocalizedNumber(empWorkHours) || 4,
      saturday_holiday_rate: parseLocalizedNumber(empDailyRate) || 100,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Funcionário cadastrado!" });
    setEmpName(""); setEmpPhone(""); setEmpEmail(""); setEmpSalary(""); setEmpWorkHours("4"); setEmpDailyRate("100");
    loadData();
  }

  async function deleteEmployee(id: string) {
    await supabase.from("employees").update({ active: false } as any).eq("id", id);
    loadData();
  }

  // Registro de ponto do dia (independente de já ter concluído o ciclo ou não) para um funcionário
  function getTodayRecord(employeeId: string) {
    const today = new Date().toISOString().slice(0, 10);
    return timeRecords.find(tr => tr.employee_id === employeeId && tr.date === today);
  }

  // Etapa atual do ciclo de ponto do dia: qual é a próxima batida esperada
  type PunchStage = "none" | "clocked_in" | "on_lunch" | "back_from_lunch" | "done";
  function getPunchStage(tr: TimeRecord | undefined): PunchStage {
    if (!tr || !tr.clock_in) return "none";
    if (tr.clock_out) return "done";
    if (!tr.lunch_out) return "clocked_in";
    if (!tr.lunch_in) return "on_lunch";
    return "back_from_lunch";
  }

  const punchStageInfo: Record<PunchStage, { label: string; action: string }> = {
    none: { label: "Nenhuma entrada registrada hoje", action: "🟢 Bater Entrada" },
    clocked_in: { label: "Entrada registrada", action: "🍽️ Bater Saída (Almoço)" },
    on_lunch: { label: "Em horário de almoço", action: "🔙 Bater Volta (Almoço)" },
    back_from_lunch: { label: "De volta do almoço", action: "🔴 Bater Saída" },
    done: { label: "Dia encerrado", action: "✅ Dia Concluído" },
  };

  async function handleNextPunch() {
    if (!selEmployee || !user) return;
    const tr = getTodayRecord(selEmployee);
    const stage = getPunchStage(tr);
    const now = new Date().toISOString();
    const today = new Date().toISOString().slice(0, 10);

    if (stage === "done") {
      toast({ title: "⚠️ Ciclo do dia já concluído", variant: "destructive" });
      return;
    }
    if (stage === "none") {
      const { error } = await supabase.from("time_records").insert({
        employee_id: selEmployee,
        user_id: user.id,
        date: today,
        clock_in: now,
        clock_out: null,
        lunch_out: null,
        lunch_in: null,
        notes: pontoNotes || null,
      });
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "✅ Entrada registrada!" });
    } else if (stage === "clocked_in" && tr) {
      const { error } = await supabase.from("time_records").update({ lunch_out: now }).eq("id", tr.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "✅ Saída para almoço registrada!" });
    } else if (stage === "on_lunch" && tr) {
      const { error } = await supabase.from("time_records").update({ lunch_in: now }).eq("id", tr.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "✅ Volta do almoço registrada!" });
    } else if (stage === "back_from_lunch" && tr) {
      const { error } = await supabase.from("time_records").update({ clock_out: now }).eq("id", tr.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "✅ Saída registrada! Dia encerrado." });
    }
    setPontoNotes("");
    loadData();
  }

  async function addPayment() {
    if (!payEmployee || !payAmount || !user) return;
    const { error } = await supabase.from("employee_payments").insert({
      employee_id: payEmployee,
      user_id: user.id,
      amount: parseFloat(payAmount),
      date: payDate,
      description: payDesc || null,
      payment_type: payType,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Pagamento registrado!" });
    setPayAmount(""); setPayDesc("");
    loadData();
  }

  async function deletePayment(id: string) {
    await supabase.from("employee_payments").delete().eq("id", id);
    loadData();
  }

  async function deleteTimeRecord(id: string) {
    await supabase.from("time_records").delete().eq("id", id);
    loadData();
  }

  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || "—";

  const fmt = (v: number) => "R$" + v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  const fmtTime = (ts: string | null) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };
  const fmtHours = (h: number) => {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${hrs}h${mins > 0 ? String(mins).padStart(2, "0") + "min" : ""}`;
  };

  // Calculate worked hours for a time record
  function calcWorkedHours(tr: TimeRecord): number {
    if (!tr.clock_in || !tr.clock_out) return 0;
    const cin = new Date(tr.clock_in).getTime();
    const cout = new Date(tr.clock_out).getTime();
    let total = (cout - cin) / 3600000; // hours
    if (tr.lunch_out && tr.lunch_in) {
      const lout = new Date(tr.lunch_out).getTime();
      const lin = new Date(tr.lunch_in).getTime();
      total -= (lin - lout) / 3600000;
    }
    return Math.max(0, total);
  }

  // Get overtime data per employee for selected month
  function getOvertimeData() {
    const filtered = timeRecords.filter(tr => {
      const matchMonth = tr.date.startsWith(horasMonth);
      const matchEmp = !horasFilterEmployee || tr.employee_id === horasFilterEmployee;
      return matchMonth && matchEmp;
    });

    const byEmployee: Record<string, { worked: number; expected: number; records: number }> = {};
    
    for (const tr of filtered) {
      const emp = employees.find(e => e.id === tr.employee_id);
      if (!emp) continue;
      if (!byEmployee[tr.employee_id]) {
        byEmployee[tr.employee_id] = { worked: 0, expected: 0, records: 0 };
      }
      byEmployee[tr.employee_id].worked += calcWorkedHours(tr);
      byEmployee[tr.employee_id].expected += emp.work_hours_per_day;
      byEmployee[tr.employee_id].records += 1;
    }

    return Object.entries(byEmployee).map(([empId, data]) => ({
      employeeId: empId,
      name: getEmployeeName(empId),
      employee: employees.find(e => e.id === empId),
      ...data,
      overtime: Math.max(0, data.worked - data.expected),
      deficit: Math.max(0, data.expected - data.worked),
    }));
  }

  // ── Fechamento de período (dia 5 ao dia 4 do mês seguinte) ──
  const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fmtDiaMes = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

  function getPeriodoForDate(ref: Date) {
    const day = ref.getDate();
    const start = new Date(ref.getFullYear(), ref.getMonth() + (day >= 5 ? 0 : -1), 5);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 5); // exclusivo
    const ultimoDia = new Date(end.getTime() - 86400000);
    return { start, end, label: `${fmtDiaMes(start)} a ${fmtDiaMes(ultimoDia)}` };
  }

  function calcPayroll(employeeId: string, refDateStr: string) {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return null;
    const ref = new Date(refDateStr + "T00:00:00");
    const { start, end, label } = getPeriodoForDate(ref);
    const todayStr = new Date().toISOString().slice(0, 10);

    const empTimeRecords = timeRecords.filter(tr => tr.employee_id === employeeId);
    const empDiarias = payments.filter(p => p.employee_id === employeeId && p.payment_type === "diaria");

    let diasUteisEsperados = 0;
    let diasTrabalhados = 0;
    let diasFaltados = 0;
    const diariasNoPeriodo: Payment[] = [];

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = toDateStr(d);
      const dow = d.getDay(); // 0 = domingo, 6 = sábado
      const diariaHoje = empDiarias.find(p => p.date === dateStr);
      if (diariaHoje) { diariasNoPeriodo.push(diariaHoje); continue; } // dia pago à parte como diária
      if (dow === 0 || dow === 6) continue; // domingo/sábado não fazem parte do salário fixo
      diasUteisEsperados++;
      const trabalhou = empTimeRecords.some(tr => tr.date === dateStr && tr.clock_in);
      if (trabalhou) diasTrabalhados++;
      else if (dateStr <= todayStr) diasFaltados++;
    }

    const valorDiaUtil = diasUteisEsperados > 0 ? emp.salary / diasUteisEsperados : 0;
    const desconto = diasFaltados * valorDiaUtil;
    const salarioProporcional = Math.max(0, emp.salary - desconto);
    const totalDiarias = diariasNoPeriodo.reduce((s, p) => s + p.amount, 0);

    return { emp, start, end, label, diasUteisEsperados, diasTrabalhados, diasFaltados, valorDiaUtil, desconto, salarioProporcional, diariasNoPeriodo, totalDiarias };
  }

  async function registrarPagamentoSalario() {
    if (!payrollEmployee || !user) return;
    const calc = calcPayroll(payrollEmployee, payrollRefDate);
    if (!calc) return;
    const desc = `Salário período ${calc.label}` + (calc.diasFaltados > 0 ? ` (${calc.diasFaltados} falta(s), desconto ${fmt(calc.desconto)})` : "");
    const { error } = await supabase.from("employee_payments").insert({
      employee_id: payrollEmployee,
      user_id: user.id,
      amount: Math.round(calc.salarioProporcional * 100) / 100,
      date: new Date().toISOString().slice(0, 10),
      description: desc,
      payment_type: "salario",
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Pagamento do salário registrado!" });
    loadData();
  }

  const tabs = ["cadastro", "ponto", "pagamentos", "horas-extras"] as const;
  const tabLabels = { cadastro: "👥 Cadastro", ponto: "⏰ Ponto", pagamentos: "💵 Pagamentos", "horas-extras": "🕐 Horas Extras" };

  if (loading) return <div className="text-center text-muted-foreground py-12">Carregando...</div>;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 mb-5 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-[13px] font-medium transition-all ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* CADASTRO */}
      {tab === "cadastro" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="mb-3.5 text-sm font-bold">+ Novo Funcionário</h3>
            <div className="space-y-2.5">
              <InputField label="Nome completo" value={empName} onChange={setEmpName} placeholder="Nome do funcionário" />
              <div className="grid grid-cols-2 gap-2.5">
                <InputField label="Cargo" value={empRole} onChange={setEmpRole} />
                <InputField label="Salário base (R$)" value={empSalary} onChange={setEmpSalary} placeholder="0,00" />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <InputField label="Telefone" value={empPhone} onChange={setEmpPhone} placeholder="(00) 00000-0000" />
                <InputField label="E-mail" value={empEmail} onChange={setEmpEmail} placeholder="email@..." />
                <InputField label="Jornada (h/dia)" value={empWorkHours} onChange={setEmpWorkHours} placeholder="8" />
              </div>
              <InputField label="Diária Sábado/Feriado (R$)" value={empDailyRate} onChange={setEmpDailyRate} placeholder="100,00" />
              <button onClick={addEmployee} className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all">
                + Cadastrar Funcionário
              </button>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border font-bold text-sm">Funcionários Ativos ({employees.length})</div>
            <div className="max-h-[500px] overflow-y-auto">
              {employees.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-[13px]">Nenhum funcionário cadastrado</div>
              ) : employees.map(e => (
                <div key={e.id} className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div>
                    <div className="text-[13px] font-medium">{e.name}</div>
                    <div className="text-[11px] text-muted-foreground">{e.role} · {e.phone || "Sem tel."} · {fmt(e.salary || 0)}/mês · {e.work_hours_per_day}h/dia · diária {fmt(e.saturday_holiday_rate ?? 100)}</div>
                  </div>
                  <button onClick={() => deleteEmployee(e.id)} className="text-muted-foreground hover:text-destructive text-xs transition-colors">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PONTO */}
      {tab === "ponto" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="mb-3.5 text-sm font-bold">⏰ Bater Ponto</h3>
            <div className="space-y-2.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Colaborador</label>
                <select value={selEmployee} onChange={e => setSelEmployee(e.target.value)} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary">
                  <option value="">Selecione...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              {selEmployee && (() => {
                const tr = getTodayRecord(selEmployee);
                const stage = getPunchStage(tr);
                return (
                  <>
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <div className="text-[11px] text-muted-foreground mb-2 text-center">{punchStageInfo[stage].label}</div>
                      <div className="grid grid-cols-4 gap-1.5 text-center">
                        <div>
                          <div className="text-[9px] text-muted-foreground uppercase">Entrada</div>
                          <div className="text-[13px] font-bold font-mono text-primary">{fmtTime(tr?.clock_in ?? null)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-muted-foreground uppercase">Saída Almoço</div>
                          <div className="text-[13px] font-bold font-mono text-warning">{fmtTime(tr?.lunch_out ?? null)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-muted-foreground uppercase">Volta Almoço</div>
                          <div className="text-[13px] font-bold font-mono text-warning">{fmtTime(tr?.lunch_in ?? null)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-muted-foreground uppercase">Saída</div>
                          <div className="text-[13px] font-bold font-mono text-destructive">{fmtTime(tr?.clock_out ?? null)}</div>
                        </div>
                      </div>
                    </div>
                    <InputField label="Observações" value={pontoNotes} onChange={setPontoNotes} placeholder="Ex: faltou, atestado..." />
                    <button onClick={handleNextPunch} disabled={stage === "done"}
                      className="w-full px-4 py-2.5 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {punchStageInfo[stage].action}
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border font-bold text-sm">Últimos Registros</div>
            <div className="max-h-[500px] overflow-y-auto">
              {timeRecords.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-[13px]">Nenhum registro de ponto</div>
              ) : timeRecords.map(tr => (
                <div key={tr.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                  <div>
                    <div className="text-[13px] font-medium">{getEmployeeName(tr.employee_id)}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {tr.date} · {fmtTime(tr.clock_in)} → {fmtTime(tr.lunch_out)} → {fmtTime(tr.lunch_in)} → {fmtTime(tr.clock_out)}
                      {" · "}<span className="font-semibold">{fmtHours(calcWorkedHours(tr))}</span>
                    </div>
                    {tr.notes && <div className="text-[10px] text-accent mt-0.5">{tr.notes}</div>}
                  </div>
                  <button onClick={() => deleteTimeRecord(tr.id)} className="text-muted-foreground hover:text-destructive text-xs transition-colors">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAGAMENTOS */}
      {tab === "pagamentos" && (
        <div className="space-y-5">
          {/* Fechamento do período (dia 5 ao dia 4 do mês seguinte) */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="mb-3.5 text-sm font-bold">📅 Fechamento do Período (dia 5 ao dia 4)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Funcionário</label>
                  <select value={payrollEmployee} onChange={e => setPayrollEmployee(e.target.value)} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary">
                    <option value="">Selecione...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <InputField label="Data de referência (qualquer dia do período)" value={payrollRefDate} onChange={setPayrollRefDate} type="date" />
              </div>
              {payrollEmployee && (() => {
                const calc = calcPayroll(payrollEmployee, payrollRefDate);
                if (!calc) return null;
                return (
                  <div className="bg-secondary/50 rounded-lg p-3.5 space-y-1.5 text-[12px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Período:</span><span className="font-semibold font-mono">{calc.label}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Dias úteis no período:</span><span className="font-mono">{calc.diasUteisEsperados}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Dias trabalhados:</span><span className="font-mono">{calc.diasTrabalhados}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Faltas:</span><span className="font-mono text-warning">{calc.diasFaltados}</span></div>
                    {calc.diasFaltados > 0 && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Desconto por faltas:</span><span className="font-mono text-destructive">-{fmt(calc.desconto)}</span></div>
                    )}
                    <div className="flex justify-between border-t border-border pt-1.5 mt-1.5"><span className="font-semibold">Salário do período:</span><span className="font-mono font-bold text-success">{fmt(calc.salarioProporcional)}</span></div>
                    <div className="flex justify-between pt-1.5"><span className="text-muted-foreground">Diárias sáb/feriado no período ({calc.diariasNoPeriodo.length}):</span><span className="font-mono">{fmt(calc.totalDiarias)}</span></div>
                    <div className="text-[10px] text-muted-foreground italic">Diárias já foram pagas no dia trabalhado — não somam ao valor do salário acima.</div>
                    <button onClick={registrarPagamentoSalario} className="w-full mt-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all">
                      💾 Lançar Pagamento do Salário ({fmt(calc.salarioProporcional)})
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="mb-3.5 text-sm font-bold">💵 Registrar Pagamento</h3>
            <div className="space-y-2.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Funcionário</label>
                <select value={payEmployee} onChange={e => setPayEmployee(e.target.value)} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary">
                  <option value="">Selecione...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <InputField label="Valor (R$)" value={payAmount} onChange={setPayAmount} placeholder="0,00" />
                <InputField label="Data" value={payDate} onChange={setPayDate} type="date" />
              </div>
              <InputField label="Descrição" value={payDesc} onChange={setPayDesc} placeholder="Ex: Salário março, vale, bônus..." />
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Tipo</label>
                <select value={payType} onChange={e => {
                  const val = e.target.value;
                  setPayType(val);
                  if (val === "diaria" && !payAmount) {
                    const emp = employees.find(x => x.id === payEmployee);
                    if (emp) setPayAmount(String(emp.saturday_holiday_rate ?? 100));
                  }
                }} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary">
                  <option value="salario">Salário</option>
                  <option value="vale">Vale / Adiantamento</option>
                  <option value="bonus">Bônus</option>
                  <option value="diaria">Diária</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <button onClick={addPayment} className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all">
                + Registrar Pagamento
              </button>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border font-bold text-sm">Últimos Pagamentos</div>
            <div className="max-h-[500px] overflow-y-auto">
              {payments.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-[13px]">Nenhum pagamento registrado</div>
              ) : payments.map(p => (
                <div key={p.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                  <div>
                    <div className="text-[13px] font-medium">{getEmployeeName(p.employee_id)}</div>
                    <div className="text-[11px] text-muted-foreground">{p.date} · {p.payment_type} · {p.description || "—"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-bold text-success">{fmt(p.amount)}</span>
                    <button onClick={() => deletePayment(p.id)} className="text-muted-foreground hover:text-destructive text-xs transition-colors">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      )}

      {/* HORAS EXTRAS */}
      {tab === "horas-extras" && (() => {
        const overtimeData = getOvertimeData();
        const totalOvertime = overtimeData.reduce((s, d) => s + d.overtime, 0);
        const totalDeficit = overtimeData.reduce((s, d) => s + d.deficit, 0);
        const totalWorked = overtimeData.reduce((s, d) => s + d.worked, 0);

        return (
          <div className="space-y-5">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-2xl font-bold font-mono text-foreground">{fmtHours(totalWorked)}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Total Trabalhado</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-2xl font-bold font-mono text-success">{fmtHours(totalOvertime)}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Horas Extras</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-2xl font-bold font-mono text-warning">{fmtHours(totalDeficit)}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Horas Devidas</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-2xl font-bold font-mono text-primary">{overtimeData.reduce((s, d) => s + d.records, 0)}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Dias Registrados</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Mês</label>
                <input type="month" value={horasMonth} onChange={e => setHorasMonth(e.target.value)}
                  className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Funcionário</label>
                <select value={horasFilterEmployee} onChange={e => setHorasFilterEmployee(e.target.value)}
                  className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary">
                  <option value="">Todos</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            </div>

            {/* Per-employee breakdown */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3.5 border-b border-border font-bold text-sm">Resumo por Funcionário — {horasMonth}</div>
              {overtimeData.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-[13px]">Nenhum registro de ponto neste mês</div>
              ) : (
                <div className="divide-y divide-border">
                  {overtimeData.map(d => {
                    const valorHora = d.employee && d.employee.salary > 0
                      ? d.employee.salary / (d.employee.work_hours_per_day * 22)
                      : 0;
                    const valorExtra = d.overtime * valorHora * 1.5; // 50% extra

                    return (
                      <div key={d.employeeId} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[13px] font-medium">{d.name}</span>
                          <span className="text-[11px] text-muted-foreground">{d.records} dias</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[12px]">
                          <div>
                            <span className="text-muted-foreground">Jornada: </span>
                            <span className="font-mono font-semibold">{fmtHours(d.expected)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Trabalhado: </span>
                            <span className="font-mono font-semibold">{fmtHours(d.worked)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Extras: </span>
                            <span className="font-mono font-semibold text-success">{fmtHours(d.overtime)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Devidas: </span>
                            <span className="font-mono font-semibold text-warning">{fmtHours(d.deficit)}</span>
                          </div>
                          {valorHora > 0 && (
                            <div>
                              <span className="text-muted-foreground">Valor HE (1.5x): </span>
                              <span className="font-mono font-semibold text-success">{fmt(valorExtra)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary w-full" />
    </div>
  );
}
