"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneCall, CheckCircle2, FileCheck, Compass } from "lucide-react";

interface InquiryItem {
  id: string;
  type: "visa" | "tour";
  name: string;
  phone: string;
  email: string;
  details: string;
  status: "new" | "contacted" | "closed";
  date: string;
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([
    {
      id: "inq-1",
      type: "visa",
      name: "Tariqul Islam",
      phone: "+880 1711-998877",
      email: "tariq@example.com",
      details: "Saudi Arabia Umrah Visa Assistance for 4 Family Members",
      status: "new",
      date: "2026-07-25 10:45 AM",
    },
    {
      id: "inq-2",
      type: "tour",
      name: "Nusrat Jahan",
      phone: "+880 1819-334455",
      email: "nusrat@example.com",
      details: "Customization inquiry for Cox's Bazar 3D2N Package",
      status: "new",
      date: "2026-07-25 09:15 AM",
    },
  ]);

  const updateStatus = (id: string, newStatus: "contacted" | "closed") => {
    setInquiries(prev =>
      prev.map(item => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-outfit text-2xl font-black text-slate-900">Manage Inquiries & Callbacks</h1>
          <p className="text-xs text-slate-500 font-semibold">View customer visa assistance forms and tour callback requests.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-4">Type & Customer</th>
                <th className="p-4">Phone / Email</th>
                <th className="p-4">Inquiry Details</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {inquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {inq.type === "visa" ? (
                        <FileCheck className="h-4 w-4 text-emerald-700" />
                      ) : (
                        <Compass className="h-4 w-4 text-amber-600" />
                      )}
                      <div>
                        <span className="font-bold text-slate-900 block">{inq.name}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{inq.type} Request</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{inq.phone}</p>
                    <p className="text-[11px] text-slate-500">{inq.email}</p>
                  </td>
                  <td className="p-4">{inq.details}</td>
                  <td className="p-4">
                    <Badge variant={inq.status === "new" ? "destructive" : "default"} className="capitalize font-bold">
                      {inq.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {inq.status !== "contacted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(inq.id, "contacted")}
                          className="text-xs font-bold rounded-xl"
                        >
                          Mark Contacted
                        </Button>
                      )}
                      {inq.status !== "closed" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(inq.id, "closed")}
                          className="text-xs font-bold rounded-xl"
                        >
                          Close Inquiry
                        </Button>
                      )}
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
}
