import React, { useState, useEffect, useMemo } from 'react';
import { Metric, MetricInputType, SurveyQuestion } from '../types';
import { api } from '../services/api';
import { ICONS } from '../constants';

const MetricModal: React.FC<{ 
    metric: Metric | null; 
    onClose: () => void; 
    onSave: () => void; 
    allMetrics: Metric[]; 
    surveyQuestions: SurveyQuestion[];
}> = ({ metric, onClose, onSave, allMetrics, surveyQuestions }) => {
    const [name, setName] = useState(metric?.name || '');
    const [unit, setUnit] = useState(metric?.unit || 'kg');
    const [inputType, setInputType] = useState(metric?.inputType || MetricInputType.Manual);
    const [formula, setFormula] = useState(metric?.formula || '');
    const [surveyQuestionKey, setSurveyQuestionKey] = useState(metric?.surveyQuestionKey || '');
    const [showInRadar, setShowInRadar] = useState(metric?.showInRadar || false);
    
    const isEditing = !!metric;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const metricData: Partial<Metric> = { 
            name, 
            unit, 
            inputType, 
            formula: inputType === MetricInputType.Calculated ? formula : '',
            surveyQuestionKey: inputType === MetricInputType.Survey ? surveyQuestionKey : '',
            showInRadar,
        };
        try {
            if (isEditing) {
                await api.updateMetric(metric.id, metricData);
            } else {
                await api.addMetric({ ...metricData, isActive: true } as Omit<Metric, 'id'>);
            }
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to save metric", error);
        }
    };
    
    // UI components for formula builder
    const calculatorKeyStyle = "p-2 rounded transition-colors text-center font-semibold";
    const numpadKeyStyle = `bg-secondary hover:bg-background ${calculatorKeyStyle}`;
    const operatorKeyStyle = `bg-primary text-white hover:bg-primary-dark ${calculatorKeyStyle}`;
    const metricKeyStyle = `bg-gray-700 text-text-light hover:bg-gray-600 p-2 text-xs rounded transition-colors`;
    const handleFormulaButtonClick = (value: string) => setFormula(prev => prev + value);
    const handleFormulaControl = (action: string) => {
        if (action === 'C') setFormula('');
        else if (action === '⌫') setFormula(prev => prev.slice(0, -1));
        else handleFormulaButtonClick(action);
    };

    const UNIT_OPTIONS = ['kg', 'cm', '%', 'saniye', 'metre', 'adet', 'kg/m²', 'Sayı', 'Hesaplama Sonucu'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{isEditing ? "Ölçümü Düzenle" : "Yeni Ölçüm Ekle"}</h3>
                    <button onClick={onClose} className="text-text-dark hover:text-text-light text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                     <div>
                        <label className="block text-sm font-medium text-text-dark">Ölçüm Adı</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-background border border-gray-700 rounded-md"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-dark">Birim</label>
                        <select value={unit} onChange={e => setUnit(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-background border border-gray-700 rounded-md">
                           {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-text-dark">Giriş Tipi</span>
                        <div className="mt-2 space-x-4">
                            <label className="inline-flex items-center">
                                <input type="radio" className="form-radio text-primary" name="metricType" value={MetricInputType.Manual} checked={inputType === MetricInputType.Manual} onChange={() => setInputType(MetricInputType.Manual)} />
                                <span className="ml-2">Manuel</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input type="radio" className="form-radio text-primary" name="metricType" value={MetricInputType.Calculated} checked={inputType === MetricInputType.Calculated} onChange={() => setInputType(MetricInputType.Calculated)} />
                                <span className="ml-2">Hesaplanan</span>
                            </label>
                             <label className="inline-flex items-center">
                                <input type="radio" className="form-radio text-primary" name="metricType" value={MetricInputType.Survey} checked={inputType === MetricInputType.Survey} onChange={() => setInputType(MetricInputType.Survey)} />
                                <span className="ml-2">Anket Verisi</span>
                            </label>
                        </div>
                    </div>
                     {inputType === MetricInputType.Survey && (
                        <div>
                            <label className="block text-sm font-medium text-text-dark">Veri Alınacak Anket Sorusu</label>
                            <select value={surveyQuestionKey} onChange={e => setSurveyQuestionKey(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-background border border-gray-700 rounded-md">
                                <option value="" disabled>Bir soru seçin...</option>
                                {surveyQuestions.filter(q => q.isActive && q.type !== 'textarea').map(q => (
                                    <option key={q.id} value={q.key}>{q.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="flex items-center">
                         <label className="flex items-center text-sm">
                            <input type="checkbox" checked={showInRadar} onChange={e => setShowInRadar(e.target.checked)} className="form-checkbox h-4 w-4 text-primary bg-gray-800 border-gray-600 rounded focus:ring-primary" />
                            <span className="ml-2">Genel Bakış (Radar) Grafiğinde Göster</span>
                        </label>
                    </div>
                    {inputType === MetricInputType.Calculated && (
                         <div className="space-y-3 p-3 bg-background rounded-md border border-gray-700">
                            <h3 className="text-sm font-medium text-text-dark">Formül Oluşturucu</h3>
                            <div className="w-full p-2 bg-secondary rounded text-right font-mono text-lg min-h-[40px] break-words">{formula || <span className="text-text-dark">...</span>}</div>
                             <div>
                                <h4 className="text-xs text-text-dark mb-2">Ölçümler</h4>
                                <div className="flex flex-wrap gap-2">
                                    {allMetrics.filter(m => m.inputType === MetricInputType.Manual && m.isActive).map(m => (
                                        <button type="button" key={m.id} onClick={() => handleFormulaButtonClick(`[${m.name}]`)} className={metricKeyStyle}>{m.name}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {['(', ')', 'C', '⌫'].map(op => <button type="button" key={op} onClick={() => handleFormulaControl(op)} className={numpadKeyStyle}>{op}</button>)}
                                {['7','8','9'].map(key => <button type="button" key={key} onClick={() => handleFormulaButtonClick(key)} className={numpadKeyStyle}>{key}</button>)}
                                <button type="button" onClick={() => handleFormulaButtonClick('/')} className={operatorKeyStyle}>÷</button>
                                {['4','5','6'].map(key => <button type="button" key={key} onClick={() => handleFormulaButtonClick(key)} className={numpadKeyStyle}>{key}</button>)}
                                <button type="button" onClick={() => handleFormulaButtonClick('*')} className={operatorKeyStyle}>×</button>
                                {['1','2','3'].map(key => <button type="button" key={key} onClick={() => handleFormulaButtonClick(key)} className={numpadKeyStyle}>{key}</button>)}
                                <button type="button" onClick={() => handleFormulaButtonClick('-')} className={operatorKeyStyle}>-</button>
                                {['0','.'].map(key => <button type="button" key={key} onClick={() => handleFormulaButtonClick(key)} className={numpadKeyStyle}>{key}</button>)}
                                <button type="button" onClick={() => handleFormulaButtonClick('+')} className={`${operatorKeyStyle} col-span-2`}>+</button>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark font-semibold">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; }> = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
);

const ManageMetrics: React.FC = () => {
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingMetric, setEditingMetric] = useState<Metric | null>(null);
    const [showModal, setShowModal] = useState(false);

    const fetchData = async () => {
        try {
            const [data, questionsData] = await Promise.all([
                api.getMetrics(),
                api.getSurveyQuestions()
            ]);
            setMetrics(data);
            setSurveyQuestions(questionsData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);
    
    const handleSave = () => {
        fetchData();
    };
    
    const handleDelete = async (metricId: string) => {
        if(window.confirm('Bu ölçümü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')){
            await api.deleteMetric(metricId);
            fetchData();
        }
    };

    const handleToggle = async (metric: Metric, field: 'isActive' | 'showInRadar') => {
        await api.updateMetric(metric.id, { [field]: !metric[field] });
        fetchData();
    };


    if (loading) {
        return <div className="text-center p-10">Ölçümler yükleniyor...</div>;
    }

    return (
        <div className="space-y-6">
            {showModal && <MetricModal metric={editingMetric} onClose={() => setShowModal(false)} onSave={handleSave} allMetrics={metrics} surveyQuestions={surveyQuestions} />}
            <div className="bg-card p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                     <h2 className="text-xl font-bold">Mevcut Ölçümler</h2>
                     <button onClick={() => { setEditingMetric(null); setShowModal(true); }} className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark font-semibold">
                        Yeni Ölçüm Ekle
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="p-3">Aktif</th>
                                <th className="p-3">Ölçüm Adı</th>
                                <th className="p-3">Birim</th>
                                <th className="p-3">Giriş Tipi / Detay</th>
                                <th className="p-3">Genel Bakış'ta Göster</th>
                                <th className="p-3 text-right">Eylemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.map(metric => (
                                <tr key={metric.id} className="border-b border-gray-800">
                                    <td className="p-3"><ToggleSwitch checked={metric.isActive} onChange={() => handleToggle(metric, 'isActive')} /></td>
                                    <td className="p-3 font-medium">{metric.name}</td>
                                    <td className="p-3 text-text-dark">{metric.unit}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            metric.inputType === MetricInputType.Manual ? 'bg-blue-500' : 
                                            metric.inputType === MetricInputType.Calculated ? 'bg-green-500' : 'bg-purple-500'
                                            } text-white`}>
                                            {metric.inputType}
                                        </span>
                                        {metric.inputType === MetricInputType.Calculated && (
                                            <p className="text-xs text-text-dark font-mono mt-1 break-all">{metric.formula}</p>
                                        )}
                                        {metric.inputType === MetricInputType.Survey && (
                                            <p className="text-xs text-text-dark font-mono mt-1 break-all">
                                                Soru: {surveyQuestions.find(q => q.key === metric.surveyQuestionKey)?.label || metric.surveyQuestionKey}
                                            </p>
                                        )}
                                    </td>
                                    <td className="p-3"><ToggleSwitch checked={metric.showInRadar ?? false} onChange={() => handleToggle(metric, 'showInRadar')} /></td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end space-x-3">
                                            <button onClick={() => { setEditingMetric(metric); setShowModal(true); }} className="text-text-dark hover:text-white">{ICONS.EDIT}</button>
                                            <button onClick={() => handleDelete(metric.id)} className="text-text-dark hover:text-red-500">{ICONS.DELETE}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageMetrics;