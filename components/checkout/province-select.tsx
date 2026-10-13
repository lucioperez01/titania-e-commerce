"use client";

const PROVINCES = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

interface ProvinceSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ProvinceSelect({ value, onChange, disabled }: ProvinceSelectProps) {
  return (
    <select
      id="addressProvince"
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="mt-1 w-full rounded-md border border-slate-200/10 bg-slate-800/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
    >
      <option value="" disabled>
        Seleccioná una provincia
      </option>
      {PROVINCES.map((province) => (
        <option key={province} value={province}>
          {province}
        </option>
      ))}
    </select>
  );
}
