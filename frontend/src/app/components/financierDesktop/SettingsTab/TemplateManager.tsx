import { useState, useRef } from 'react';
import { Upload, Trash2, FileText } from 'lucide-react';
import { api } from '@/lib/api';

interface TemplateManagerProps {
    templates: any[];
    onRefresh: () => void;
}

export function TemplateManager({ templates, onRefresh }: TemplateManagerProps) {
    const [uploading, setUploading] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        const file = fileRef.current?.files?.[0];
        if (!file || !templateName.trim()) {
            alert('Выберите файл и введите название');
            return;
        }
        setUploading(true);
        try {
            await api.uploadTemplate(file, templateName.trim());
            setTemplateName('');
            if (fileRef.current) fileRef.current.value = '';
            onRefresh();
        } catch (err: any) {
            alert(`Ошибка загрузки: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (templateId: string, name: string) => {
        if (!confirm(`Удалить шаблон "${name}"?`)) return;
        try {
            await api.deleteTemplate(templateId);
            onRefresh();
        } catch {
            alert('Ошибка удаления');
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Шаблоны документов</h2>
                <p className="text-sm text-gray-500">Загрузите DOCX шаблоны для экспорта отчётов. Максимум 5 шаблонов.</p>
            </div>

            {/* Upload form */}
            <form onSubmit={handleUpload} className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-blue-800">Загрузить новый шаблон</h3>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Название шаблона</label>
                    <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Акт приёмки LAND"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Файл DOCX</label>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".docx"
                        className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                    />
                </div>
                <button
                    type="submit"
                    disabled={uploading || templates.length >= 5}
                    className="flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Загрузка...' : 'Загрузить'}
                </button>
            </form>

            {/* Templates list */}
            <div className="space-y-3">
                {templates.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Нет загруженных шаблонов</p>
                    </div>
                ) : (
                    templates.map((t: any) => (
                        <div key={t.template_id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
                            <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 truncate">{t.name}</p>
                                <p className="text-xs text-gray-400">
                                    {t.file_size ? `${Math.round(t.file_size / 1024)} KB • ` : ''}
                                    {t.uploaded_at?.slice(0, 10)}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(t.template_id, t.name)}
                                className="text-red-400 hover:text-red-600 transition-colors p-1"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Variables reference */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <h3 className="font-bold text-gray-700 mb-2 text-sm">Поддерживаемые переменные в шаблоне</h3>
                <div className="text-xs text-gray-500 font-mono space-y-1">
                    <p>{'{{order_id}}'} — номер заказа</p>
                    <p>{'{{branch}}'} — филиал</p>
                    <p>{'{{day}}'}, {'{{month_name}}'}, {'{{year}}'} — дата</p>
                    <p>{'{{total_ordered}}'}, {'{{total_received}}'} — итоги</p>
                    <p>{'{{completion_rate}}'} — % доставки</p>
                    <p>{'{{delivered_items}}'}, {'{{not_delivered_items}}'} — списки товаров</p>
                    <p>{'{{#all_items}}...{{/all_items}}'} — все товары (цикл)</p>
                </div>
            </div>
        </div>
    );
}
