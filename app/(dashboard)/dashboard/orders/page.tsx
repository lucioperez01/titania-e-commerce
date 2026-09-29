import { getOrdersAction, getOrderStatusCountsAction } from "./actions";
import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import { Package, Search } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string;
    email?: string;
    page?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const status = params.status as OrderStatus | undefined;
  const email = params.email;
  const dateFrom = params.dateFrom ? new Date(params.dateFrom) : undefined;
  const dateTo = params.dateTo ? new Date(params.dateTo) : undefined;

  const [ordersResult, statusCounts] = await Promise.all([
    getOrdersAction({ page, status, email, dateFrom, dateTo }),
    getOrderStatusCountsAction(),
  ]);

  const statusLabels: Record<OrderStatus, string> = {
    PENDING: "Pendiente",
    RESERVED: "Reservado",
    PAID: "Pagado",
    SHIPPED: "Enviado",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
    EXPIRED: "Expirado",
    RETURNED: "Devuelto",
    REFUNDED: "Reembolsado",
  };

  const statusColors: Record<OrderStatus, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    RESERVED: "bg-blue-500/20 text-blue-400",
    PAID: "bg-emerald-500/20 text-emerald-400",
    SHIPPED: "bg-purple-500/20 text-purple-400",
    DELIVERED: "bg-green-500/20 text-green-400",
    CANCELLED: "bg-red-500/20 text-red-400",
    EXPIRED: "bg-gray-500/20 text-gray-400",
    RETURNED: "bg-orange-500/20 text-orange-400",
    REFUNDED: "bg-pink-500/20 text-pink-400",
  };

  return (
    <div className="flex flex-col gap-6 p-6 text-white">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
          Pedidos
        </h1>
        <p className="text-slate-300 mt-1">Gestión de pedidos y órdenes</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        {statusCounts.map(({ status: s, count }) => (
          <Link
            key={s}
            href={`/dashboard/orders?status=${s}`}
            className="rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm p-4 shadow-xl hover:bg-neutral-800/40 transition-all"
          >
            <div className="text-sm text-slate-300 font-medium">{statusLabels[s]}</div>
            <div className="text-2xl font-bold mt-1 text-white">{count}</div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm p-6 shadow-xl">
        <form className="flex flex-wrap gap-4 mb-6" method="GET" action="/dashboard/orders">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300 font-medium">Estado</label>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="bg-neutral-800 border border-purple-400/30 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">Todos</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300 font-medium">Email</label>
            <input
              type="text"
              name="email"
              defaultValue={email ?? ""}
              placeholder="buscar@email.com"
              className="bg-neutral-800 border border-purple-400/30 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300 font-medium">Desde</label>
            <input
              type="date"
              name="dateFrom"
              defaultValue={params.dateFrom ?? ""}
              className="bg-neutral-800 border border-purple-400/30 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300 font-medium">Hasta</label>
            <input
              type="date"
              name="dateTo"
              defaultValue={params.dateTo ?? ""}
              className="bg-neutral-800 border border-purple-400/30 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Filtrar
            </button>
          </div>

          <div className="flex items-end">
            <Link
              href="/dashboard/orders"
              className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Limpiar
            </Link>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-purple-400/30 text-left">
                <th className="pb-3 text-xs font-medium text-slate-300">ID</th>
                <th className="pb-3 text-xs font-medium text-slate-300">Cliente</th>
                <th className="pb-3 text-xs font-medium text-slate-300">Email</th>
                <th className="pb-3 text-xs font-medium text-slate-300">Total</th>
                <th className="pb-3 text-xs font-medium text-slate-300">Items</th>
                <th className="pb-3 text-xs font-medium text-slate-300">Estado</th>
                <th className="pb-3 text-xs font-medium text-slate-300">Fecha</th>
                <th className="pb-3 text-xs font-medium text-slate-300"></th>
              </tr>
            </thead>
            <tbody>
              {ordersResult.orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-4">
                    {status || email || dateFrom || dateTo ? (
                      <EmptyState
                        icon={Search}
                        title="No se encontraron pedidos"
                        description="No hay pedidos que coincidan con los filtros seleccionados"
                        action={{ label: "Limpiar filtros", href: "/dashboard/orders" }}
                      />
                    ) : (
                      <EmptyState
                        icon={Package}
                        title="No hay pedidos todavía"
                        description="Cuando recibas pedidos, aparecerán aquí con todos los detalles"
                        action={{ label: "Ver productos", href: "/dashboard/products" }}
                      />
                    )}
                  </td>
                </tr>
              ) : (
                ordersResult.orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-purple-400/10 hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="py-3 text-sm font-mono text-white">#{order.id}</td>
                    <td className="py-3 text-sm text-white">{order.fullName}</td>
                    <td className="py-3 text-sm text-slate-300">{order.email}</td>
                    <td className="py-3 text-sm font-medium text-white">
                      ${order.total.toLocaleString("es-AR")}
                    </td>
                    <td className="py-3 text-sm text-slate-300">{order.itemCount}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-slate-300">
                      {order.createdAt.toLocaleDateString("es-AR")}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {ordersResult.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: ordersResult.totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/dashboard/orders?page=${p}${status ? `&status=${status}` : ""}${email ? `&email=${email}` : ""}`}
                className={`px-3 py-1 rounded-lg text-sm ${
                  p === page
                    ? "bg-purple-600 text-white"
                    : "bg-neutral-800 text-slate-300 hover:bg-neutral-700"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
