'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

// Schema untuk Create
const CreateInvoice = FormSchema.omit({ id: true, date: true });

// 1.0 FUNCTION CREATE INVOICE
export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// Schema untuk Update
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// 2.0 FUNCTION UPDATE INVOICE (Sesuai Halaman 21)
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// 3.0 FUNCTION DELETE INVOICE (🌟 TAMBAHAN BARU Sesuai Halaman 23)
export async function deleteInvoice(id: string) {
  // Menjalankan query SQL DELETE untuk menghapus data berdasarkan ID
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  
  // Menyegarkan halaman agar baris data yang dihapus langsung hilang dari tabel
  revalidatePath('/dashboard/invoices');
}