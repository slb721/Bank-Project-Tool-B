"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "react-hot-toast";

export default function PaycheckForm({ onPaycheckAdded }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
      toast.error("You must be logged in to add a paycheck.");
      return;
    }

    const { error } = await supabase.from("paychecks").insert([
      {
        amount: parseFloat(amount),
        date,
        user_id: user.id,
      },
    ]);

    if (error) {
      console.error("Insert error:", error.message);
      toast.error("Failed to add paycheck.");
    } else {
      toast.success("Paycheck added.");
      setAmount("");
      setDate("");
      onPaycheckAdded(); // trigger data refresh
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="number"
        placeholder="Paycheck Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        className="border px-2 py-1 rounded w-full"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
        className="border px-2 py-1 rounded w-full"
      />
      <button type="submit" className="bg-green-600 text-white px-4 py-1 rounded">
        Add Paycheck
      </button>
    </form>
  );
}
