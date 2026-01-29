import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import { 
  Home, Activity, MessageCircle, User, ArrowLeft, 
  Pill, Calendar, Plus, Check, Bell, Trash2, Edit, 
  Clock, CalendarPlus, Phone, LogOut, CreditCard, ChevronLeft, ChevronRight 
} from 'lucide-react';

import mascotImg from './assets/mascote.png'; 

// --- FUNÇÕES AUXILIARES ---
const calculateAge = (birthDateString) => {
  if (!birthDateString) return { months: 0, weeks: 0 };
  const birthDate = new Date(birthDateString);
  const today = new Date();
  const diffTime = Math.abs(today - birthDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffDays / 30.44);
  const weeks = Math.floor(diffDays / 7);
  return { months, weeks };
};

const getNextMedication = (medications) => {
  if (!medications || medications.length === 0) return null;
  const now = new Date();
  const currentTimeVal = now.getHours() * 60 + now.getMinutes();
  let nextMed = null;
  let minDiff = Infinity;
  medications.forEach(med => {
    med.schedule.forEach(slot => {
      if (!slot.taken) {
        const [h, m] = slot.time.split(':').map(Number);
        const diff = (h * 60 + m) - currentTimeVal;
        const adjustedDiff = diff < -60 ? diff + 1440 : diff; 
        if (adjustedDiff < minDiff && adjustedDiff > -60) {
          minDiff = adjustedDiff;
          nextMed = { name: med.name, dose: med.dose, time: slot.time };
        }
      }
    });
  });
  return nextMed;
};

const formatDateDisplay = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}`;
};

const getWeeklyAgenda = (therapies) => {
  const today = new Date();
  const nextWeek = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayEvents = therapies.filter(t => t.date === dateStr);
    if (dayEvents.length > 0) {
      nextWeek.push({
        date: dateStr,
        displayDate: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
        events: dayEvents.sort((a, b) => a.time.localeCompare(b.time))
      });
    }
  }
  return nextWeek;
};

const addToGoogleCalendar = (therapy) => {
  const text = encodeURIComponent(`Terapia: ${therapy.specialty}`);
  const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${encodeURIComponent(therapy.professional)}&dates=${therapy.date.replace(/-/g,'')}T${therapy.time.replace(/:/g,'')}00/${therapy.date.replace(/-/g,'')}T${Number(therapy.time.replace(/:/g,'')) + 10000}00&sf=true&output=xml`;
  window.open(url, '_blank');
};

// --- COMPONENTES ---
const TopBar = ({ onProfileClick }) => (
  <div className="header-simple">
    <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.8)', padding: '5px 12px', borderRadius: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'}}>
      <img src={mascotImg} className="mascot-logo-small" alt="Logo" />
      <span style={{fontWeight: 'bold', color: '#33691E'}}>Stripo</span>
    </div>
    <div onClick={onProfileClick} style={{background: 'white', padding: '8px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'pointer'}}>
      <User size={20} color="#33691E" />
    </div>
  </div>
);

const NotificationModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{background: '#E8F5E9', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto'}}><Check size={30} color="#558B2F" /></div>
        <h3 style={{color: '#33691E', margin: '0 0 10px 0'}}>{title || "Sucesso!"}</h3>
        <p style={{color: '#666', fontSize: '0.9rem'}}>{message || "Alterações salvas com sucesso."}</p>
        <button className="btn-primary" onClick={onClose} style={{marginBottom: 0}}>Ok</button>
      </div>
    </div>
  );
};

// --- TELAS DO APP ---
const MedicamentosView = ({ medications, setMedications }) => {
  const [isAdding, setIsAdding] = useState(false); const [editingId, setEditingId] = useState(null); const [newMedName, setNewMedName] = useState(''); const [newMedDose, setNewMedDose] = useState(''); const [tempTime, setTempTime] = useState(''); const [newMedTimes, setNewMedTimes] = useState([]); const [showPushModal, setShowPushModal] = useState(false);
  const handleEdit = (med) => { setNewMedName(med.name); setNewMedDose(med.dose); setNewMedTimes(med.schedule.map(s => s.time)); setEditingId(med.id); setIsAdding(true); };
  const handleDelete = (id) => { if (window.confirm("Excluir?")) setMedications(medications.filter(m => m.id !== id)); };
  const handleAddTime = () => { if (tempTime && !newMedTimes.includes(tempTime)) { setNewMedTimes([...newMedTimes, tempTime].sort()); setTempTime(''); } };
  const handleSaveMed = () => { if (!newMedName || !newMedDose || newMedTimes.length === 0) { alert("Preencha tudo."); return; } const medData = { id: editingId || Date.now(), name: newMedName, dose: newMedDose, schedule: newMedTimes.map(t => ({ time: t, taken: false })) }; if (editingId) setMedications(medications.map(m => m.id === editingId ? medData : m)); else { setMedications([...medications, medData]); setShowPushModal(true); } setIsAdding(false); setEditingId(null); setNewMedName(''); setNewMedDose(''); setNewMedTimes([]); };
  const toggleTaken = (medId, timeStr) => { setMedications(medications.map(med => { if (med.id === medId) return { ...med, schedule: med.schedule.map(s => s.time === timeStr ? { ...s, taken: !s.taken } : s) }; return med; })); };
  return (<div className="animate-fade" style={{paddingBottom:'80px'}}><NotificationModal isOpen={showPushModal} onClose={()=>setShowPushModal(false)} /><TopBar /><h2 className="section-title" style={{marginTop:0}}>Medicamentos</h2>{isAdding?(<div className="card-white"><h3 style={{marginTop:0, color:'#33691E'}}>{editingId?'Editar':'Novo'}</h3><div className="input-group"><label className="input-label">Nome</label><input className="input-field" value={newMedName} onChange={e=>setNewMedName(e.target.value)}/></div><div className="input-group"><label className="input-label">Dose</label><input className="input-field" value={newMedDose} onChange={e=>setNewMedDose(e.target.value)}/></div><div className="input-group"><label className="input-label">Horários</label><div style={{display:'flex', gap:'10px'}}><input type="time" className="input-field" value={tempTime} onChange={e=>setTempTime(e.target.value)}/><button onClick={handleAddTime} style={{background:'#DCEDC8', border:'none', borderRadius:'12px', padding:'0 15px', color:'#33691E', fontWeight:'bold'}}>ADD</button></div><div className="time-chip-container">{newMedTimes.map((t, idx)=>(<div key={idx} className="time-chip">{t}<span onClick={()=>setNewMedTimes(newMedTimes.filter(time=>time!==t))} style={{cursor:'pointer', marginLeft:'5px'}}>×</span></div>))}</div></div><div style={{display:'flex', gap:'10px', marginTop:'20px'}}><button className="btn-secondary" onClick={()=>setIsAdding(false)}>Cancelar</button><button className="btn-primary" onClick={handleSaveMed} style={{marginBottom:0}}>Salvar</button></div></div>):(<><div>{medications.length===0?<div style={{textAlign:'center', padding:'30px', opacity:0.6}}>Nenhum medicamento</div>:medications.map(med=>(<div key={med.id} className="card-white med-card"><div className="med-header"><div><h3 style={{margin:0, color:'#33691E'}}>{med.name}</h3><span style={{fontSize:'0.8rem', color:'#888', fontWeight:'bold'}}>{med.dose}</span></div><div style={{display:'flex', alignItems:'center'}}><div className="card-actions"><button className="action-btn edit" onClick={()=>handleEdit(med)}><Edit size={18}/></button><button className="action-btn delete" onClick={()=>handleDelete(med.id)}><Trash2 size={18}/></button></div></div></div><div className="med-schedule-list" style={{marginTop:'10px'}}>{med.schedule.map((slot, idx)=>(<div key={idx} className="med-time-item"><span>{slot.taken?<s style={{opacity:0.5}}>{slot.time}</s>:<strong>{slot.time}</strong>}</span><div className={`custom-checkbox ${slot.taken?'checked':''}`} onClick={()=>toggleTaken(med.id, slot.time)}>{slot.taken&&<Check size={16} color="white"/>}</div></div>))}</div></div>))}</div><button className="fab-button" onClick={()=>{setNewMedName('');setNewMedDose('');setNewMedTimes([]);setEditingId(null);setIsAdding(true);}}><Plus size={28}/></button></>)}</div>);
};

const TerapiasView = ({ therapies, setTherapies }) => {
  const [isAdding, setIsAdding] = useState(false); const [editingId, setEditingId] = useState(null); const [showPushModal, setShowPushModal] = useState(false); const [specialty, setSpecialty] = useState(''); const [professional, setProfessional] = useState(''); const [date, setDate] = useState(''); const [time, setTime] = useState('');
  const handleEdit = (item) => { setSpecialty(item.specialty); setProfessional(item.professional); setDate(item.date); setTime(item.time); setEditingId(item.id); setIsAdding(true); };
  const handleDelete = (id) => { if (window.confirm("Excluir?")) setTherapies(therapies.filter(t => t.id !== id)); };
  const handleSave = () => { if (!specialty || !date || !time) { alert("Preencha tudo."); return; } const data = { id: editingId || Date.now(), specialty, professional, date, time }; if (editingId) setTherapies(therapies.map(t => t.id === editingId ? data : t)); else { setTherapies([...therapies, data]); setShowPushModal(true); } setIsAdding(false); setEditingId(null); setSpecialty(''); setProfessional(''); setDate(''); setTime(''); };
  return (<div className="animate-fade" style={{paddingBottom:'80px'}}><NotificationModal isOpen={showPushModal} onClose={()=>setShowPushModal(false)} /><TopBar /><h2 className="section-title" style={{marginTop:0}}>Terapias</h2>{isAdding?(<div className="card-white"><h3 style={{marginTop:0, color:'#33691E'}}>{editingId?'Editar':'Nova'}</h3><div className="input-group"><label className="input-label">Especialidade</label><input className="input-field" value={specialty} onChange={e=>setSpecialty(e.target.value)}/></div><div className="input-group"><label className="input-label">Profissional</label><input className="input-field" value={professional} onChange={e=>setProfessional(e.target.value)}/></div><div style={{display:'flex', gap:'10px'}}><div className="input-group" style={{flex:1}}><label className="input-label">Data</label><input type="date" className="input-field" value={date} onChange={e=>setDate(e.target.value)}/></div><div className="input-group" style={{flex:1}}><label className="input-label">Horário</label><input type="time" className="input-field" value={time} onChange={e=>setTime(e.target.value)}/></div></div><div style={{display:'flex', gap:'10px', marginTop:'20px'}}><button className="btn-secondary" onClick={()=>setIsAdding(false)}>Cancelar</button><button className="btn-primary" onClick={handleSave} style={{marginBottom:0}}>Salvar</button></div></div>):(<><div>{therapies.length===0?<div style={{textAlign:'center', padding:'30px', opacity:0.6}}>Nenhuma terapia</div>:therapies.map(t=>(<div key={t.id} className="card-white therapy-card"><div style={{display:'flex', justifyContent:'space-between'}}><div><h3 style={{margin:0, color:'#E65100'}}>{t.specialty}</h3><p style={{margin:'2px 0 5px 0', fontSize:'0.9rem', color:'#EF6C00'}}>{t.professional}</p></div><div className="card-actions"><button className="action-btn edit" onClick={()=>handleEdit(t)}><Edit size={18}/></button><button className="action-btn delete" onClick={()=>handleDelete(t.id)}><Trash2 size={18}/></button></div></div><div style={{display:'flex', gap:'10px', fontSize:'0.9rem', color:'#666'}}><Calendar size={16}/><span>{formatDateDisplay(t.date)}</span><Clock size={16}/><span>{t.time}</span></div><button className="btn-calendar" onClick={()=>addToGoogleCalendar(t)}><CalendarPlus size={16}/> Add Agenda</button></div>))}</div><button className="fab-button" onClick={()=>{setSpecialty('');setProfessional('');setDate('');setTime('');setEditingId(null);setIsAdding(true);}}><Plus size={28}/></button></>)}</div>);
};

const AgendaView = ({ therapies, professionals, setProfessionals }) => {
  const [activeTab, setActiveTab] = useState('calendar'); const [currentDate, setCurrentDate] = useState(new Date()); const [selectedDay, setSelectedDay] = useState(new Date().getDate()); const [isAddingProf, setIsAddingProf] = useState(false); const [profName, setProfName] = useState(''); const [profSpec, setProfSpec] = useState(''); const [profPhone, setProfPhone] = useState('');
  const year = currentDate.getFullYear(); const month = currentDate.getMonth(); const daysInMonth = new Date(year, month + 1, 0).getDate(); const firstDay = new Date(year, month, 1).getDay(); const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`; const eventsForSelectedDay = therapies.filter(t => t.date === selectedDateStr);
  const handleAddProf = () => { if(!profName) return; setProfessionals([...professionals, { id: Date.now(), name: profName, specialty: profSpec, phone: profPhone }]); setIsAddingProf(false); setProfName(''); setProfSpec(''); setProfPhone(''); }; const handleDeleteProf = (id) => { if(confirm("Remover?")) setProfessionals(professionals.filter(p => p.id !== id)); };
  return (<div className="animate-fade" style={{paddingBottom:'80px'}}><TopBar /><h2 className="section-title" style={{marginTop:0}}>Agenda</h2><div className="toggle-switch" style={{margin:'0 20px 20px 20px'}}><div className={`toggle-option ${activeTab==='calendar'?'active':''}`} onClick={()=>setActiveTab('calendar')}>Calendário</div><div className={`toggle-option ${activeTab==='professionals'?'active':''}`} onClick={()=>setActiveTab('professionals')}>Profissionais</div></div>{activeTab==='calendar'?(<div style={{padding:'0 20px'}}><div className="calendar-container"><div className="calendar-header"><button onClick={()=>{setCurrentDate(new Date(year, month-1, 1));setSelectedDay(1)}} style={{background:'none', border:'none'}}><ChevronLeft/></button><span style={{textTransform:'capitalize'}}>{monthName}</span><button onClick={()=>{setCurrentDate(new Date(year, month+1, 1));setSelectedDay(1)}} style={{background:'none', border:'none'}}><ChevronRight/></button></div><div className="calendar-grid">{['D','S','T','Q','Q','S','S'].map(d=><div key={d} className="calendar-day-label">{d}</div>)}{Array.from({length:firstDay}).map((_,i)=><div key={`empty-${i}`}/>)}{Array.from({length:daysInMonth}).map((_,i)=>{const day=i+1;const hasEvent=therapies.some(t=>t.date===`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`);return(<div key={day} className={`calendar-day ${selectedDay===day?'selected':''} ${hasEvent?'has-event':''}`} onClick={()=>setSelectedDay(day)}>{day}</div>);})}</div></div><h3 className="section-title">Dia {selectedDay}</h3><div>{eventsForSelectedDay.length>0?eventsForSelectedDay.map(t=>(<div key={t.id} className="card-white therapy-card"><div style={{display:'flex', justifyContent:'space-between'}}><div><h4 style={{margin:0, color:'#E65100'}}>{t.specialty}</h4><p style={{margin:0, fontSize:'0.9rem', color:'#EF6C00'}}>{t.professional}</p></div><div style={{fontWeight:'bold', color:'#E65100'}}>{t.time}</div></div></div>)):(<p style={{textAlign:'center', color:'#999'}}>Nada agendado.</p>)}</div></div>):(<div style={{padding:'0 20px'}}>{isAddingProf?(<div className="card-white"><h3 style={{marginTop:0, color:'#1565C0'}}>Novo Profissional</h3><div className="input-group"><label className="input-label">Nome</label><input className="input-field" value={profName} onChange={e=>setProfName(e.target.value)}/></div><div className="input-group"><label className="input-label">Especialidade</label><input className="input-field" value={profSpec} onChange={e=>setProfSpec(e.target.value)}/></div><div className="input-group"><label className="input-label">Telefone</label><input className="input-field" value={profPhone} onChange={e=>setProfPhone(e.target.value)}/></div><div style={{display:'flex', gap:'10px', marginTop:'15px'}}><button className="btn-secondary" onClick={()=>setIsAddingProf(false)}>Cancelar</button><button className="btn-primary" onClick={handleAddProf} style={{marginBottom:0, background:'#42A5F5'}}>Salvar</button></div></div>):(<> {professionals.length===0?<p style={{textAlign:'center', color:'#999'}}>Nenhum contato salvo.</p>:professionals.map(p=>(<div key={p.id} className="professional-card"><div><h4 style={{margin:0, color:'#1565C0'}}>{p.name}</h4><p style={{margin:0, fontSize:'0.85rem', color:'#64B5F6'}}>{p.specialty}</p><p style={{margin:0, fontSize:'0.8rem', color:'#999'}}>{p.phone}</p></div><div style={{display:'flex', gap:'10px'}}><a href={`tel:${p.phone}`} className="btn-call"><Phone size={20}/></a><button className="btn-call" style={{background:'#FFEBEE', color:'#E57373'}} onClick={()=>handleDeleteProf(p.id)}><Trash2 size={20}/></button></div></div>))}<button className="fab-button" style={{background:'#42A5F5'}} onClick={()=>setIsAddingProf(true)}><Plus size={28}/></button></>)}</div>)}</div>);
};

const ProfileView = ({ userData, setUserData, onLogout }) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [localData, setLocalData] = useState(userData);
  const handlePhotoUpload = (field, e) => { const file = e.target.files[0]; if (file) { const imageUrl = URL.createObjectURL(file); setLocalData({ ...localData, [field]: imageUrl }); } };
  const handleSave = () => { setUserData(localData); setShowSaveModal(true); };
  return (<div className="animate-fade" style={{paddingBottom:'80px'}}><NotificationModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} title="Perfil Atualizado" message="Suas informações foram salvas!" /><div className="header-simple"><button onClick={() => window.history.back()} style={{background:'none', border:'none'}}><ArrowLeft color="#33691E"/></button><h3 style={{margin:0, color:'#33691E'}}>Meu Perfil</h3><div style={{width:24}}></div></div><div style={{padding:'0 20px'}}><div className="profile-header"><div className="profile-photos-edit"><img src={localData.babyPhoto} style={{width:'100px', height:'100px', borderRadius:'50%', border:'4px solid white', boxShadow:'0 5px 15px rgba(0,0,0,0.1)', objectFit:'cover'}}/><img src={localData.momPhoto} style={{width:'40px', height:'40px', borderRadius:'50%', border:'2px solid white', position:'absolute', bottom:0, right:0, objectFit:'cover'}}/><label htmlFor="baby-change" style={{position:'absolute', bottom:0, right:0, background:'#7B1FA2', color:'white', borderRadius:'50%', width:'30px', height:'30px', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10}}><Edit size={14}/></label><input id="baby-change" type="file" style={{display:'none'}} onChange={(e)=>handlePhotoUpload('babyPhoto',e)}/></div><p style={{color:'#888', fontSize:'0.8rem'}}>Toque para alterar a foto</p></div><div className="card-white"><div className="profile-section-label">Dados da Conta</div><div className="input-group"><label className="input-label">Nome da Mamãe</label><input className="input-field" value={localData.momName} onChange={e=>setLocalData({...localData, momName:e.target.value})}/></div><div className="input-group"><label className="input-label">E-mail</label><input className="input-field" value="mamãe@email.com" disabled style={{opacity:0.6}}/></div><div className="profile-section-label">Dados do Bebê</div><div className="input-group"><label className="input-label">Nome do Bebê</label><input className="input-field" value={localData.babyName} onChange={e=>setLocalData({...localData, babyName:e.target.value})}/></div><div className="input-group"><label className="input-label">Data de Nascimento</label><input className="input-field" type="date" value={localData.birthDate} onChange={e=>setLocalData({...localData, birthDate:e.target.value})}/></div><div className="profile-section-label">Assinatura</div><div style={{background:'#E8F5E9', padding:'15px', borderRadius:'15px', display:'flex', alignItems:'center', gap:'15px'}}><CreditCard color="#2E7D32"/><div><div style={{fontWeight:'bold', color:'#1B5E20'}}>Plano Gratuito</div><div style={{fontSize:'0.8rem', color:'#4CAF50'}}>Aproveite o Stripo!</div></div></div></div><button className="btn-save" onClick={handleSave}>Salvar Alterações</button><button className="btn-secondary" style={{marginTop:'10px', display:'flex', justifyContent:'center', gap:'10px', color:'#666', borderColor:'#ccc'}} onClick={onLogout}><LogOut size={18}/> Sair do App</button><button className="btn-danger">Excluir Minha Conta</button><p style={{textAlign:'center', fontSize:'0.7rem', color:'#ccc', marginTop:'10px'}}>Versão 1.0.1</p></div></div>);
};

// --- AUTH & SPLASH ---
const SplashView = ({ onNavigate }) => (<div className="auth-screen"><div className="mascot-container-large"><img src={mascotImg} alt="Stripo Mascote" className="mascot-img"/></div><h1 style={{fontSize:'2.5rem', marginBottom:'5px', color:'#556B2F'}}>Stripo</h1><p style={{marginBottom:'40px', color:'#7CB342', fontWeight:500}}>Crescendo com você.</p><div style={{width:'100%', maxWidth:'300px'}}><button className="btn-primary" onClick={()=>onNavigate('login')}>ENTRAR</button><button className="btn-secondary" onClick={()=>onNavigate('register_mom')}>CRIAR CONTA</button></div></div>);
const LoginView = ({ onNavigate }) => (<div className="auth-screen" style={{justifyContent:'flex-start', paddingTop:'60px'}}><div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'30px'}}><img src={mascotImg} style={{width:'50px'}} alt="Mascote"/><h2 style={{margin:0, color:'#556B2F'}}>Olá de novo!</h2></div><div className="auth-card"><div className="input-group"><label className="input-label">E-mail</label><input className="input-field" type="email" placeholder="mamãe@email.com"/></div><div className="input-group"><label className="input-label">Senha</label><input className="input-field" type="password" placeholder="••••••••"/></div><button className="btn-primary" onClick={()=>onNavigate('app')}>ACESSAR</button></div><button style={{marginTop:'20px', background:'none', border:'none', color:'#556B2F', fontWeight:'bold'}} onClick={()=>onNavigate('splash')}>Voltar</button></div>);
const RegisterMomView = ({ userData, setUserData, onNavigate }) => { const handleImageUpload = (e) => { const file = e.target.files[0]; if (file) { const imageUrl = URL.createObjectURL(file); setUserData({ ...userData, momPhoto: imageUrl }); } }; return (<div className="auth-screen" style={{justifyContent:'flex-start', paddingTop:'40px'}}><div style={{width:'100%', maxWidth:'300px', marginBottom:'20px'}}><button onClick={()=>onNavigate('splash')} style={{background:'none', border:'none', padding:0}}><ArrowLeft color="#556B2F"/></button></div><div style={{textAlign:'center', marginBottom:'20px'}}><h2 style={{color:'#556B2F', margin:0}}>Vamos começar!</h2><p style={{color:'#7CB342', margin:'5px 0 0 0'}}>Passo 1 de 2: Seus Dados</p></div><div className="auth-card"><div style={{display:'flex', justifyContent:'center', marginBottom:'20px'}}><div style={{position:'relative', width:'100px', height:'100px'}}><img src={userData.momPhoto || "https://via.placeholder.com/100?text=Foto"} style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover', border:'3px solid #E1EAC2'}}/><label htmlFor="mom-upload" style={{position:'absolute', bottom:0, right:0, background:'#7B1FA2', color:'white', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><User size={18}/></label><input id="mom-upload" type="file" accept="image/*" style={{display:'none'}} onChange={handleImageUpload}/></div></div><div className="input-group"><label className="input-label">Seu Nome</label><input className="input-field" type="text" placeholder="Como quer ser chamada?" value={userData.momName} onChange={(e)=>setUserData({...userData, momName:e.target.value})}/></div><button className="btn-primary" onClick={()=>onNavigate('register_baby')}>PRÓXIMO</button></div></div>); };
const RegisterBabyView = ({ userData, setUserData, onNavigate }) => { const handleImageUpload = (e) => { const file = e.target.files[0]; if (file) { const imageUrl = URL.createObjectURL(file); setUserData({ ...userData, babyPhoto: imageUrl }); } }; return (<div className="auth-screen" style={{justifyContent:'flex-start', paddingTop:'40px'}}><div style={{width:'100%', maxWidth:'300px', marginBottom:'20px'}}><button onClick={()=>onNavigate('register_mom')} style={{background:'none', border:'none', padding:0}}><ArrowLeft color="#556B2F"/></button></div><div style={{textAlign:'center', marginBottom:'20px'}}><h2 style={{color:'#556B2F', margin:0}}>Sobre o Bebê</h2><p style={{color:'#7CB342', margin:'5px 0 0 0'}}>Passo 2 de 2</p></div><div className="auth-card"><div style={{display:'flex', justifyContent:'center', marginBottom:'20px'}}><div style={{position:'relative', width:'100px', height:'100px'}}><img src={userData.babyPhoto || "https://via.placeholder.com/100?text=Baby"} style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover', border:'3px solid #E1EAC2'}}/><label htmlFor="baby-upload" style={{position:'absolute', bottom:0, right:0, background:'#9CCC65', color:'white', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><User size={18}/></label><input id="baby-upload" type="file" accept="image/*" style={{display:'none'}} onChange={handleImageUpload}/></div></div><div className="input-group"><label className="input-label">Nome da Criança</label><input className="input-field" type="text" placeholder="Nome do pequeno(a)" value={userData.babyName} onChange={(e)=>setUserData({...userData, babyName:e.target.value})}/></div><div className="input-group"><label className="input-label">Data de Nascimento</label><input className="input-field" type="date" value={userData.birthDate} onChange={(e)=>setUserData({...userData, birthDate:e.target.value})}/></div><button className="btn-primary" onClick={()=>onNavigate('app')}>FINALIZAR</button></div></div>); };

// --- APP PRINCIPAL ---
function App() {
  const [currentView, setCurrentView] = useState('splash');
  const [appTab, setAppTab] = useState('home');
  const [userData, setUserData] = useState(() => { const saved = localStorage.getItem('stripo_userData'); return saved ? JSON.parse(saved) : { momName: '', babyName: '', birthDate: '', momPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200", babyPhoto: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400" }; });
  const [medications, setMedications] = useState(() => { const saved = localStorage.getItem('stripo_medications'); return saved ? JSON.parse(saved) : []; });
  const [therapies, setTherapies] = useState(() => { const saved = localStorage.getItem('stripo_therapies'); return saved ? JSON.parse(saved) : []; });
  const [professionals, setProfessionals] = useState(() => { const saved = localStorage.getItem('stripo_professionals'); return saved ? JSON.parse(saved) : []; });

  useEffect(() => { localStorage.setItem('stripo_userData', JSON.stringify(userData)); }, [userData]);
  useEffect(() => { localStorage.setItem('stripo_medications', JSON.stringify(medications)); }, [medications]);
  useEffect(() => { localStorage.setItem('stripo_therapies', JSON.stringify(therapies)); }, [therapies]);
  useEffect(() => { localStorage.setItem('stripo_professionals', JSON.stringify(professionals)); }, [professionals]);

  const age = useMemo(() => calculateAge(userData.birthDate), [userData.birthDate]);
  const nextMed = getNextMedication(medications);
  const weeklyAgenda = getWeeklyAgenda(therapies);
  const handleLogout = () => { setCurrentView('splash'); setAppTab('home'); };

  const renderMainApp = () => (
    <div className="app-container">
      <main>
        {appTab === 'home' && (<div className="animate-fade"><header className="hero-header"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><div style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.3)', padding: '5px 12px', borderRadius: '20px'}}><img src={mascotImg} className="mascot-logo-small" alt="Logo" /><span style={{fontWeight: 'bold', color: '#33691E'}}>Stripo</span></div><div onClick={() => setCurrentView('profile')} style={{background: 'rgba(255,255,255,0.3)', padding: '8px', borderRadius: '50%', cursor:'pointer'}}><User size={20} color="#33691E" /></div></div><div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}><div style={{position: 'relative', width: '80px', height: '80px', marginBottom: '10px'}}><img src={userData.babyPhoto} style={{width: '100%', height: '100%', borderRadius: '50%', border: '3px solid white', objectFit: 'cover'}} alt="Bebê" /><img src={userData.momPhoto} style={{width: '35px', height: '35px', borderRadius: '50%', border: '2px solid white', position: 'absolute', bottom: 0, right: 0, objectFit: 'cover'}} alt="Mãe" /></div><h2 style={{margin: 0, color: '#33691E'}}>Bom dia,</h2><h1 style={{margin: 0, color: '#1B5E20', fontSize: '1.6rem'}}>{userData.momName || 'Mamãe'} & {userData.babyName || 'Bebê'}</h1></div></header><div className="age-cards-container"><div className="age-card"><span className="age-number">{age.months}</span><span style={{fontSize: '0.7rem', fontWeight: 'bold', color: '#8F9E78'}}>MESES</span></div><div className="age-card"><span className="age-number">{age.weeks}</span><span style={{fontSize: '0.7rem', fontWeight: 'bold', color: '#8F9E78'}}>SEMANAS</span></div></div><h3 className="section-title">Próxima Medicação</h3>{nextMed ? ( <div className="card-white highlight-card"><div style={{display: 'flex', alignItems: 'center', padding: '10px 0'}}><div style={{background: 'white', padding: '10px', borderRadius: '50%', color: '#558B2F', marginRight: '15px'}}><Pill size={24} /></div><div><h4 style={{margin: 0, color: '#33691E'}}>{nextMed.name}</h4><p style={{margin: '2px 0 0 0', fontSize: '0.9rem', color: '#558B2F'}}>{nextMed.dose}</p></div><div style={{marginLeft: 'auto', textAlign: 'right'}}><div style={{display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.5)', padding: '5px 10px', borderRadius: '15px'}}><Clock size={16} color="#33691E" /><strong style={{color: '#33691E'}}>{nextMed.time}</strong></div></div></div></div> ) : (<div className="card-white" style={{textAlign: 'center', color: '#888', fontStyle: 'italic', padding: '20px'}}>Tudo em dia! 🌿</div>)}<h3 className="section-title">Agenda da Semana</h3><div className="card-white">{weeklyAgenda.length > 0 ? weeklyAgenda.map((dayGroup, idx) => (<div key={idx}><div className="week-day-header">{dayGroup.displayDate}</div>{dayGroup.events.map(t => (<div key={t.id} className="agenda-item"><div style={{width: '4px', height: '40px', background: '#FFA726', borderRadius: '2px'}}></div><div style={{flex: 1}}><h4 style={{margin: 0, color: '#E65100'}}>{t.specialty}</h4><p style={{margin: 0, fontSize: '0.85rem', color: '#FB8C00'}}>{t.time} - {t.professional}</p></div></div>))}</div>)) : (<p style={{textAlign: 'center', color: '#999', fontSize: '0.9rem'}}>Semana livre!</p>)}</div></div>)}
        {appTab === 'medicamentos' && <MedicamentosView medications={medications} setMedications={setMedications} />}
        {appTab === 'terapias' && <TerapiasView therapies={therapies} setTherapies={setTherapies} />}
        {appTab === 'agenda' && <AgendaView therapies={therapies} professionals={professionals} setProfessionals={setProfessionals} />}
      </main>

      <nav className="bottom-nav">
        <button className={`nav-btn ${appTab === 'home' ? 'active' : ''}`} onClick={() => setAppTab('home')}><Home size={22} /><span>Início</span></button>
        <button className={`nav-btn ${appTab === 'medicamentos' ? 'active' : ''}`} onClick={() => setAppTab('medicamentos')}><Pill size={22} /><span style={{fontSize: '0.6rem'}}>Remédios</span></button>
        <button className={`nav-btn ${appTab === 'terapias' ? 'active' : ''}`} onClick={() => setAppTab('terapias')}><Activity size={22} /><span>Terapias</span></button>
        <button className={`nav-btn ${appTab === 'agenda' ? 'active' : ''}`} onClick={() => setAppTab('agenda')}><Calendar size={22} /><span>Agenda</span></button>
      </nav>
    </div>
  );

  switch (currentView) {
    case 'splash': return <SplashView onNavigate={setCurrentView} />;
    case 'login': return <LoginView onNavigate={setCurrentView} />;
    case 'register_mom': return <RegisterMomView userData={userData} setUserData={setUserData} onNavigate={setCurrentView} />;
    case 'register_baby': return <RegisterBabyView userData={userData} setUserData={setUserData} onNavigate={setCurrentView} />;
    case 'profile': return <ProfileView userData={userData} setUserData={setUserData} onLogout={handleLogout} />;
    case 'app': return renderMainApp();
    default: return <SplashView onNavigate={setCurrentView} />;
  }
}

export default App;