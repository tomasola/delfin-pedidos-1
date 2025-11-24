import React, { useState, useEffect } from 'react';
import { getOrders, deleteOrder } from '../../services/storageService';
import { OrderRecord } from '../../types';
import { Search, Trash2, FileText, ChevronDown, Package } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const HistoryOrders: React.FC = () => {
    const [orders, setOrders] = useState<OrderRecord[]>([]);
    const [searchOrder, setSearchOrder] = useState('');
    const [searchClient, setSearchClient] = useState('');
    const [uniqueClients, setUniqueClients] = useState<string[]>([]);

    // State for Delete
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [pin, setPin] = useState('');

    // State for Detail View
    const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        const loadedOrders = await getOrders();
        setOrders(loadedOrders);

        // Extract unique client names for dropdown
        const clients = Array.from(new Set(loadedOrders.map(o => o.clientName).filter(Boolean)));
        setUniqueClients(clients.sort());
    };

    const filteredOrders = orders.filter(o => {
        const matchesOrder = searchOrder === '' ||
            o.orderNumber.toLowerCase().includes(searchOrder.toLowerCase());
        const matchesClient = searchClient === '' ||
            o.clientName.toLowerCase() === searchClient.toLowerCase();
        return matchesOrder && matchesClient;
    });

    // Delete Handlers
    const handleDeleteRequest = (id: string) => {
        setDeleteId(id);
        setPin('');
    };

    const confirmDelete = async () => {
        if (pin === '1234' && deleteId) {
            const updated = await deleteOrder(deleteId);
            setOrders(updated);
            setDeleteId(null);
        } else {
            alert("PIN Incorrecto");
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-900">
            {/* Search Section */}
            <div className="p-4 bg-slate-800 border-b border-slate-700 sticky top-0 z-10 space-y-3">
                {/* Search by Order Number */}
                <div className="relative">
                    <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por número de pedido..."
                        className="w-full bg-slate-900 text-white pl-10 pr-4 py-3 rounded-lg border border-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
                        value={searchOrder}
                        onChange={(e) => setSearchOrder(e.target.value)}
                    />
                </div>

                {/* Search by Client (Dropdown) */}
                <div className="relative">
                    <FileText className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <select
                        className="w-full bg-slate-900 text-white pl-10 pr-10 py-3 rounded-lg border border-slate-700 focus:ring-2 focus:ring-amber-500 outline-none appearance-none"
                        value={searchClient}
                        onChange={(e) => setSearchClient(e.target.value)}
                    >
                        <option value="">Todos los clientes</option>
                        {uniqueClients.map(client => (
                            <option key={client} value={client}>{client}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={18} />
                </div>

                {/* Results Count */}
                <div className="text-sm text-slate-400 text-center">
                    {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''} encontrado{filteredOrders.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredOrders.length === 0 ? (
                    <div className="text-center text-slate-500 py-12">
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No hay pedidos guardados</p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <div
                            key={order.id}
                            className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-amber-500/50 transition-all cursor-pointer"
                            onClick={() => setSelectedOrder(order)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                    <h3 className="text-white font-semibold text-lg">Pedido #{order.orderNumber}</h3>
                                    <p className="text-amber-500 text-sm">{order.clientName}</p>
                                    {order.clientNumber && (
                                        <p className="text-slate-400 text-xs">Cliente #{order.clientNumber}</p>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteRequest(order.id); }}
                                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-slate-400">Fecha:</span>
                                    <span className="text-white ml-2">{new Date(order.date).toLocaleDateString()}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400">Productos:</span>
                                    <span className="text-white ml-2">{order.products?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <Modal isOpen={true} onClose={() => setDeleteId(null)} title="Confirmar Eliminación">
                    <div className="space-y-4">
                        <p className="text-slate-300">Ingresa el PIN para eliminar este pedido:</p>
                        <Input
                            type="password"
                            placeholder="PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            maxLength={4}
                        />
                        <div className="flex gap-2">
                            <Button onClick={confirmDelete} variant="danger" className="flex-1">
                                <Trash2 size={18} className="mr-2" />
                                Eliminar
                            </Button>
                            <Button onClick={() => setDeleteId(null)} variant="secondary" className="flex-1">
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Detail View Modal */}
            {selectedOrder && (
                <Modal isOpen={true} onClose={() => setSelectedOrder(null)} title={`Pedido #${selectedOrder.orderNumber}`}>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                        {selectedOrder.originalImage && (
                            <div className="mb-4">
                                <img
                                    src={selectedOrder.originalImage}
                                    alt="Pedido"
                                    className="w-full rounded-lg border border-slate-700"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-slate-400 block">Cliente:</span>
                                <span className="text-white font-semibold">{selectedOrder.clientName}</span>
                            </div>
                            {selectedOrder.clientNumber && (
                                <div>
                                    <span className="text-slate-400 block">Nº Cliente:</span>
                                    <span className="text-white font-semibold">{selectedOrder.clientNumber}</span>
                                </div>
                            )}
                            <div>
                                <span className="text-slate-400 block">Fecha:</span>
                                <span className="text-white font-semibold">{new Date(selectedOrder.date).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Products Table */}
                        <div className="mt-4">
                            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <Package size={18} className="text-amber-500" />
                                Productos ({selectedOrder.products?.length || 0})
                            </h4>
                            {selectedOrder.products && selectedOrder.products.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedOrder.products.map((product, index) => (
                                        <div key={index} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-amber-500 font-semibold text-sm">#{index + 1}</span>
                                                <span className="text-white font-semibold">{product.reference}</span>
                                            </div>
                                            <div className="text-sm space-y-1">
                                                <div>
                                                    <span className="text-slate-400">Denominación:</span>
                                                    <span className="text-white ml-2">{product.denomination}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <span className="text-slate-400">Total:</span>
                                                        <span className="text-white ml-2">{product.totalMeters}m</span>
                                                    </div>
                                                    {product.metersPerUnit && (
                                                        <div>
                                                            <span className="text-slate-400">Por unidad:</span>
                                                            <span className="text-white ml-2">{product.metersPerUnit}m</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm">No hay productos en este pedido</p>
                            )}
                        </div>

                        {selectedOrder.notes && (
                            <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                                <span className="text-slate-400 text-sm block mb-1">Notas:</span>
                                <p className="text-white">{selectedOrder.notes}</p>
                            </div>
                        )}

                        <div className="text-xs text-slate-500 text-center pt-2">
                            Guardado: {new Date(selectedOrder.timestamp).toLocaleString()}
                        </div>

                        <Button onClick={() => setSelectedOrder(null)} variant="secondary" className="w-full">
                            Cerrar
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};
