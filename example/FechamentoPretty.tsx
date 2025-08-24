import React from "react";
import { SafeAreaView, ScrollView, View, Text } from "react-native";
import { TopBar } from "../components/ui/TopBar";
import { Card } from "../components/ui/Card";
import { SectionHeader } from "../components/ui/Section";
import { InputMoney } from "../components/ui/InputMoney";
import { NameValueRow } from "../components/ui/NameValueRow";
import { QuickCounter } from "../components/ui/QuickCounter";
import { Button } from "../components/ui/Button";
import { SummaryBar } from "../components/ui/SummaryBar";

const DENOMS = [
  { label: "Raspinha 2,50", value: 2.5 },
  { label: "Raspinha 5,00", value: 5 },
  { label: "Raspinha 10,00", value: 10 },
  { label: "Raspinha 20,00", value: 20 },
];

export default function FechamentoPretty() {
  // fake local state just to demo UI (plug into your real state/actions)
  const [entradaDinheiro, setEntradaDinheiro] = React.useState<string[]>(["R$ 0,00"]);
  const [entradaFixos, setEntradaFixos] = React.useState<Record<string,string>>({ Moeda:"", Tarifa:"", Bolão:"", Mkt:"", Telesena:"" });
  const [entradaReceb, setEntradaReceb] = React.useState<{nome:string; valor:string}[]>([{nome:"", valor:""}]);
  const [denoms, setDenoms] = React.useState<Record<string, number>>({ "2.5":0, "5":0, "10":0, "20":0 });

  const [saidaRet, setSaidaRet] = React.useState<string[]>(["R$ 0,00"]);
  const [saidaFixos, setSaidaFixos] = React.useState<Record<string,string>>({ Moeda:"", Bolão:"", Mkt:"", Troca:"", Raspinha:"" });
  const [saidaPix, setSaidaPix] = React.useState<{nome:string; valor:string}[]>([{nome:"", valor:""}]);
  const [saidaFiado, setSaidaFiado] = React.useState<{nome:string; valor:string}[]>([{nome:"", valor:""}]);
  const [saidaOutros, setSaidaOutros] = React.useState<{nome:string; valor:string}[]>([{nome:"", valor:""}]);

  const num = (s?: string) => Number(String(s||"0").replace(/[^\d,.-]/g,"").replace(".", "").replace(",", ".")) || 0;
  const sumArr = (arr: string[]) => arr.reduce((a,v)=>a+num(v),0);
  const sumNV  = (arr: {valor:string}[]) => arr.reduce((a,it)=>a+num(it.valor),0);
  const sumDen = () => (denoms["2.5"]||0)*2.5 + (denoms["5"]||0)*5 + (denoms["10"]||0)*10 + (denoms["20"]||0)*20;

  const totalEntrada = sumArr(entradaDinheiro) + num(entradaFixos.Moeda)+num(entradaFixos.Tarifa)+num(entradaFixos["Bolão"])+num(entradaFixos.Mkt)+num(entradaFixos.Telesena) + sumNV(entradaReceb) + sumDen();
  const totalSaida = sumArr(saidaRet) + num(saidaFixos.Moeda)+num(saidaFixos["Bolão"])+num(saidaFixos.Mkt)+num(saidaFixos.Troca)+num(saidaFixos.Raspinha) + sumNV(saidaPix) + sumNV(saidaFiado) + sumNV(saidaOutros);

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <TopBar title="Fechamento de Caixa" subtitle="Layout novo — mais limpo e rápido" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>

        <Card>
          <Text className="text-text font-semibold text-lg mb-3">Entrada</Text>

          <SectionHeader title="Dinheiro" onAdd={() => setEntradaDinheiro(v => [...v, "R$ 0,00"])} />
          {entradaDinheiro.map((v, i) => (
            <InputMoney key={i} value={v} onChangeText={(nv)=>{
              const c=[...entradaDinheiro]; c[i]=nv; setEntradaDinheiro(c);
            }} />
          ))}

          {["Moeda","Tarifa","Bolão","Mkt"].map((k)=>(
            <InputMoney key={k} label={k} value={entradaFixos[k]||""} onChangeText={(v)=>setEntradaFixos(s=>({...s,[k]:v}))} />
          ))}

          <SectionHeader title="Recebimentos" onAdd={() => setEntradaReceb(v=>[...v,{nome:"",valor:""}])} />
          {entradaReceb.map((it,i)=>(
            <NameValueRow key={i} name={it.nome} value={it.valor}
              onChangeName={(t)=>{ const c=[...entradaReceb]; c[i].nome=t; setEntradaReceb(c);}}
              onChangeValue={(t)=>{ const c=[...entradaReceb]; c[i].valor=t; setEntradaReceb(c);}}
              onRemove={entradaReceb.length>1?()=>setEntradaReceb(v=>v.filter((_,ix)=>ix!==i)):undefined}
            />
          ))}

          <InputMoney label="Telesena" value={entradaFixos["Telesena"]||""} onChangeText={(v)=>setEntradaFixos(s=>({...s,["Telesena"]:v}))} />

          <Text className="text-textmtuted"></Text>
          <Text className="text-text font-semibold mt-2 mb-1">Raspinha</Text>
          {DENOMS.map((d)=> (
            <QuickCounter key={d.value} denom={d} qty={denoms[String(d.value)]||0}
              onInc={()=>setDenoms(s=>({ ...s, [String(d.value)]: (s[String(d.value)]||0)+1 }))}
              onDec={()=>setDenoms(s=>({ ...s, [String(d.value)]: Math.max(0,(s[String(d.value)]||0)-1) }))}
              onAdd={(n)=>setDenoms(s=>({ ...s, [String(d.value)]: (s[String(d.value)]||0)+n }))}
            />
          ))}

          <SummaryBar entrada={totalEntrada} saida={totalSaida} />
        </Card>

        <Card>
          <Text className="text-text font-semibold text-lg mb-3">Saída</Text>

          <SectionHeader title="Retiradas" onAdd={() => setSaidaRet(v => [...v, "R$ 0,00"])} />
          {saidaRet.map((v,i)=>(
            <InputMoney key={i} value={v} onChangeText={(nv)=>{const c=[...saidaRet]; c[i]=nv; setSaidaRet(c);}} />
          ))}

          {["Moeda","Bolão","Mkt"].map((k)=>(
            <InputMoney key={k} label={k} value={saidaFixos[k]||""} onChangeText={(v)=>setSaidaFixos(s=>({...s,[k]:v}))} />
          ))}

          <SectionHeader title="Pix" onAdd={() => setSaidaPix(v=>[...v,{nome:"",valor:""}])} />
          {saidaPix.map((it,i)=>(
            <NameValueRow key={i} name={it.nome} value={it.valor}
              onChangeName={(t)=>{ const c=[...saidaPix]; c[i].nome=t; setSaidaPix(c);}}
              onChangeValue={(t)=>{ const c=[...saidaPix]; c[i].valor=t; setSaidaPix(c);}}
              onRemove={saidaPix.length>1?()=>setSaidaPix(v=>v.filter((_,ix)=>ix!==i)):undefined}
            />
          ))}

          <SectionHeader title="Fiado" onAdd={() => setSaidaFiado(v=>[...v,{nome:"",valor:""}])} />
          {saidaFiado.map((it,i)=>(
            <NameValueRow key={i} name={it.nome} value={it.valor}
              onChangeName={(t)=>{ const c=[...saidaFiado]; c[i].nome=t; setSaidaFiado(c);}}
              onChangeValue={(t)=>{ const c=[...saidaFiado]; c[i].valor=t; setSaidaFiado(c);}}
              onRemove={saidaFiado.length>1?()=>setSaidaFiado(v=>v.filter((_,ix)=>ix!==i)):undefined}
            />
          ))}

          <InputMoney label="Troca" value={saidaFixos["Troca"]||""} onChangeText={(v)=>setSaidaFixos(s=>({...s,["Troca"]:v}))} />
          <InputMoney label="Raspinha" value={saidaFixos["Raspinha"]||""} onChangeText={(v)=>setSaidaFixos(s=>({...s,["Raspinha"]:v}))} />

          <SectionHeader title="Outros" onAdd={() => setSaidaOutros(v=>[...v,{nome:"",valor:""}])} />
          {saidaOutros.map((it,i)=>(
            <NameValueRow key={i} name={it.nome} value={it.valor}
              onChangeName={(t)=>{ const c=[...saidaOutros]; c[i].nome=t; setSaidaOutros(c);}}
              onChangeValue={(t)=>{ const c=[...saidaOutros]; c[i].valor=t; setSaidaOutros(c);}}
              onRemove={saidaOutros.length>1?()=>setSaidaOutros(v=>v.filter((_,ix)=>ix!==i)):undefined}
            />
          ))}

          <SummaryBar entrada={totalEntrada} saida={totalSaida} />
        </Card>

        <View className="flex-row gap-8 my-2">
          <Button title="Fechar dia & Enviar" onPress={()=>{}} />
          <Button title="Limpar valores" variant="ghost" onPress={()=>{}} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
