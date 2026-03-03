"use client";
import { usePathname, useRouter } from "@/i18n/navigation";
import clsx from "clsx";
import { useParams } from "next/navigation";
import { ChangeEvent, ReactNode, useTransition } from "react";
type Props = {
  children: ReactNode;
  defaultValue: string,
  label: string
}
export default function LocalSwitcherSelect({
  children,
  defaultValue,
  label
}: Props){
  const router = useRouter();
  const [isPending, startTranstition] = useTransition();
  const pathname = usePathname();
  const params = useParams();
  function onSelectChange(event: ChangeEvent<HTMLSelectElement>){
    const nextLocale = event.target.value;
    startTranstition(()=>{
      router.replace(
        //@ts-ignore
        {pathname, params},
        {locale: nextLocale}
      )
    })
  }
  return(
    <label className={clsx("relative text-gray-400", isPending && "transition-opacity disabled:opacity-30")}>
      <p className="sr-only">{label}</p>
      <select 
      className="inline-flex appearance-none bg-transparent py-3 pl-2 pr-6"
      defaultValue={defaultValue}
      disabled={isPending}
      onChange={onSelectChange}
      >
        {children}
      </select>
    </label>
  )
}