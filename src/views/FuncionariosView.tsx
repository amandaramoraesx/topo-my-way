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
  const [empWorkHours, setEmpWorkHours] = useState("8");

  const [selEmployee, setSelEmployee] = useState("");
  const [pontoDate, setPontoDate] = useState(new Date().toISOString().slice(0, 10));
  const [clockIn, setClockIn] = useState("08:00");
  const [clockOut, setClockOut] = useState("17:00");
  const [lunchOut, setLunchOut] = useState("12:00");
  const [lunchIn, setLunchIn] = useState("13:00");
  const [pontoNotes, setPontoNotes] = useState("");

  const [payEmployee, setPayEmployee] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payDesc, setPayDesc] = useState("");
  const [payType, setPayType] = useState("salario");
  const [horasFilterEmployee, setHorasFilterEmployee] = useState("");
  const [horasMonth, setHorasMonth] = useState(new Date().toISOString().slice(0, 7));
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

  async function addEmployee() {
    if (!empName || !user) return;
    const { error } = await supabase.from("employees").insert({
      user_id: user.id,
      name: empName,
      role: empRole,
      phone: empPhone,
      email: empEmail,
      salary: parseFloat(empSalary) || 0,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Funcionário cadastrado!" });
    setEmpName(""); setEmpPhone(""); setEmpEmail(""); setEmpSalary(""); setEmpWorkHours("8");
    loadData();
  }

  async function deleteEmployee(id: string) {
    await supabase.from("employees").update({ active: false } as any).eq("id", id);
    loadData();
  }

  async function addTimeRecord() {
    if (!selEmployee || !user) return;
    const toTs = (date: string, time: string) => `${date}T${time}:00`;
    const { error } = await supabase.from("time_records").insert({
      employee_id: selEmployee,
      user_id: user.id,
      date: pontoDate,
      clock_in: toTs(pontoDate, clockIn),
      clock_out: toTs(pontoDate, clockOut),
      lunch_out: toTs(pontoDate, lunchOut),
      lunch_in: toTs(pontoDate, lunchIn),
      notes: pontoNotes || null,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Ponto registrado!" });
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
              <div className="grid grid-cols-2 gap-2.5">
                <InputField label="Telefone" value={empPhone} onChange={setEmpPhone} placeholder="(00) 00000-0000" />
                <InputField label="E-mail" value={empEmail} onChange={setEmpEmail} placeholder="email@..." />
              </div>
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
                    <div className="text-[11px] text-muted-foreground">{e.role} · {e.phone || "Sem tel."} · {fmt(e.salary || 0)}/mês</div>
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
            <h3 className="mb-3.5 text-sm font-bold">⏰ Registrar Ponto</h3>
            <div className="space-y-2.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Funcionário</label>
                <select value={selEmployee} onChange={e => setSelEmployee(e.target.value)} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary">
                  <option value="">Selecione...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <InputField label="Data" value={pontoDate} onChange={setPontoDate} type="date" />
              <div className="grid grid-cols-2 gap-2.5">
                <InputField label="Entrada" value={clockIn} onChange={setClockIn} type="time" />
                <InputField label="Saída Almoço" value={lunchOut} onChange={setLunchOut} type="time" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <InputField label="Volta Almoço" value={lunchIn} onChange={setLunchIn} type="time" />
                <InputField label="Saída" value={clockOut} onChange={setClockOut} type="time" />
              </div>
              <InputField label="Observações" value={pontoNotes} onChange={setPontoNotes} placeholder="Ex: faltou, atestado..." />
              <button onClick={addTimeRecord} className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all">
                ✅ Registrar Ponto
              </button>
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
                      {tr.date} · {fmtTime(tr.clock_in)} → {fmtTime(tr.clock_out)}
                      {tr.lunch_out && ` · Almoço: ${fmtTime(tr.lunch_out)}–${fmtTime(tr.lunch_in)}`}
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
                <select value={payType} onChange={e => setPayType(e.target.value)} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary">
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
      )}
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
