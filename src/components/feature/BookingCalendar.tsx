import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TimeSlot {
  start_time: string; // "YYYY-MM-DD HH:mm:ss"
  end_time: string; // "YYYY-MM-DD HH:mm:ss"
}

interface BookingTexts {
  stepDateTitle: string;
  stepDateDesc: string;
  stepTimeTitle: string;
  stepTimeDesc: string;
  stepFormTitle: string;
  stepFormDesc: string;
  monthPrev: string;
  monthNext: string;
  selectDate: string;
  selectTime: string;
  noSlots: string;
  loading: string;
  reviewTitle: string;
  reviewDate: string;
  reviewStart: string;
  reviewEnd: string;
  modifyTime: string;
  labelName: string;
  placeholderName: string;
  labelPhone: string;
  placeholderPhone: string;
  labelNotes: string;
  placeholderNotes: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successDesc: string;
  errorGeneric: string;
  errorFetch: string;
  required: string;
}

interface BookingCalendarProps {
  timeslotsApi: string;
  appointmentsApi: string;
  texts: BookingTexts;
  containerStyle?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

function extractDate(iso: string): string {
  return iso.split(' ')[0];
}

function extractTime(iso: string): string {
  return iso.split(' ')[1]?.slice(0, 5) ?? '';
}

function monthName(year: number, month: number): string {
  const months = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
  ];
  return `${months[month]} ${year}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  // 0 = Sunday ... 6 = Saturday → convert to 0 = Monday ... 6 = Sunday
  const fd = new Date(year, month, 1).getDay();
  return fd === 0 ? 6 : fd - 1;
}

function groupSlotsByDate(slots: TimeSlot[]): Map<string, TimeSlot[]> {
  const map = new Map<string, TimeSlot[]>();
  for (const s of slots) {
    const d = extractDate(s.start_time);
    const arr = map.get(d);
    if (arr) arr.push(s);
    else map.set(d, [s]);
  }
  return map;
}

function findClosestDate(availableDates: string[], today: string): string | null {
  let best: string | null = null;
  for (const d of availableDates) {
    if (d >= today && (!best || d < best)) best = d;
  }
  if (!best && availableDates.length > 0) {
    best = availableDates.reduce((a, b) => (a > b ? a : b));
  }
  return best;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function BookingCalendar({
  timeslotsApi,
  appointmentsApi,
  texts,
  containerStyle,
}: BookingCalendarProps) {
  /* ---- state ---- */
  const [step, setStep] = useState<number>(0);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(true);
  const [errorSlots, setErrorSlots] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<{ y: number; m: number }>({
    y: new Date().getFullYear(),
    m: new Date().getMonth(),
  });
  const [formName, setFormName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const datesContainerRef = useRef<HTMLDivElement>(null);

  /* ---- derived ---- */
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  const slotsByDate = useMemo(() => groupSlotsByDate(slots), [slots]);
  const availableDates = useMemo(() => [...slotsByDate.keys()].sort(), [slotsByDate]);

  const dayAbbrs = useMemo(() => ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'], []);

  /* ---- fetch ---- */
  const fetchSlots = useCallback(async () => {
    setLoadingSlots(true);
    setErrorSlots('');
    try {
      const res = await fetch(timeslotsApi);
      if (!res.ok) throw new Error(texts.errorFetch);
      const data: TimeSlot[] = await res.json();
      setSlots(data);
    } catch {
      setErrorSlots(texts.errorFetch);
    } finally {
      setLoadingSlots(false);
    }
  }, [timeslotsApi, texts.errorFetch]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  /* ---- auto-select closest date & navigate calendar ---- */
  useEffect(() => {
    if (availableDates.length === 0) return;
    const closest = findClosestDate(availableDates, today);
    if (!closest) return;
    setSelectedDate(closest);
    const [y, m] = closest.split('-').map(Number);
    setCalendarMonth({ y, m: m - 1 });
  }, [availableDates, today]);

  /* ---- ensure calendar month always has available dates on refresh ---- */
  useEffect(() => {
    if (availableDates.length === 0) return;
    const ym = `${calendarMonth.y}-${pad(calendarMonth.m + 1)}`;
    const hasAvailable = availableDates.some((d) => d.startsWith(ym));
    if (!hasAvailable) {
      const closest = findClosestDate(availableDates, today);
      if (closest) {
        const [y, m] = closest.split('-').map(Number);
        setCalendarMonth({ y, m: m - 1 });
      }
    }
  }, [availableDates, calendarMonth, today]);

  /* ---- calendar helpers ---- */
  const changeMonth = useCallback((delta: number) => {
    setCalendarMonth((prev) => {
      let nm = prev.m + delta;
      let ny = prev.y;
      if (nm < 0) { nm = 11; ny -= 1; }
      if (nm > 11) { nm = 0; ny += 1; }
      return { y: ny, m: nm };
    });
  }, []);

  const calendarDays = useMemo(() => {
    const { y, m } = calendarMonth;
    const total = daysInMonth(y, m);
    const startDay = firstDayOfMonth(y, m);
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calendarMonth]);

  /* ---- handlers ---- */
  const goToStep = useCallback((s: number) => setStep(s), []);

  const handleDateClick = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setStep(1);
  }, []);

  const handleSlotClick = useCallback((slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep(2);
  }, []);

  const handleModifyTime = useCallback(() => {
    setStep(0);
  }, []);

  // Auto-scroll to selected date section when entering Step 1
  useEffect(() => {
    if (step === 1 && selectedDate && datesContainerRef.current) {
      setTimeout(() => {
        const el = document.getElementById(`date-section-${selectedDate}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [step, selectedDate]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedSlot) return;
      setSubmitting(true);
      setSubmitError('');
      setSubmitSuccess(false);

      const body: Record<string, string> = {
        customer_name: formName.trim(),
        customer_phone: formPhone.trim(),
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
      };
      if (formNotes.trim()) body.notes = formNotes.trim();

      try {
        const res = await fetch(appointmentsApi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(texts.errorGeneric);
        setSubmitSuccess(true);
        setSelectedDate('');
        setSelectedSlot(null);
        setFormName('');
        setFormPhone('');
        setFormNotes('');
        setStep(0);
        await fetchSlots();
      } catch {
        setSubmitError(texts.errorGeneric);
      } finally {
        setSubmitting(false);
      }
    },
    [
      selectedSlot, formName, formPhone, formNotes,
      appointmentsApi, texts, fetchSlots,
    ],
  );

  /* ---- render ---- */

  return (
    <div style={containerStyle} className="w-full">
      {/* ---- Step indicators ---- */}
      <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
        {[0, 1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                step === s
                  ? 'bg-primary-500 text-white'
                  : step > s
                    ? 'bg-accent-500 text-white'
                    : 'bg-background-200 text-foreground-400'
              }`}
            >
              {step > s ? <i className="ri-check-line"></i> : s + 1}
            </div>
            <span
              className={`text-xs font-semibold whitespace-nowrap hidden sm:inline ${
                step === s ? 'text-foreground-900' : 'text-foreground-400'
              }`}
            >
              {s === 0 ? texts.stepDateTitle : s === 1 ? texts.stepTimeTitle : texts.stepFormTitle}
            </span>
            {s < 2 && <div className="w-6 sm:w-10 h-px bg-background-300" />}
          </div>
        ))}
      </div>

      {/* ---- Loading / Error ---- */}
      {loadingSlots ? (
        <div className="flex flex-col items-center justify-center py-20 text-foreground-500">
          <i className="ri-loader-4-line animate-spin text-3xl mb-3"></i>
          <span className="text-sm">{texts.loading}</span>
        </div>
      ) : errorSlots ? (
        <div className="flex flex-col items-center justify-center py-20 text-foreground-500">
          <i className="ri-error-warning-line text-3xl mb-3 text-red-500"></i>
          <span className="text-sm mb-3">{errorSlots}</span>
          <button
            type="button"
            onClick={fetchSlots}
            className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-refresh-line"></i>
            {texts.selectDate}
          </button>
        </div>
      ) : availableDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-foreground-500">
          <i className="ri-calendar-event-line text-3xl mb-3"></i>
          <span className="text-sm">{texts.noSlots}</span>
        </div>
      ) : (
        <>
          {/* ========== STEP 0: DATE SELECTION ========== */}
          {step === 0 && (
            <div className="max-w-[420px] mx-auto">
              <div className="text-center mb-6">
                <h3 className="font-heading text-xl font-bold text-foreground-950">
                  {texts.stepDateTitle}
                </h3>
                <p className="mt-1 text-sm text-foreground-500">{texts.stepDateDesc}</p>
              </div>

              {/* Calendar header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-background-200 bg-background-50 text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer"
                >
                  <i className="ri-arrow-left-s-line text-sm"></i>
                </button>
                <span className="text-sm font-bold text-foreground-900">
                  {monthName(calendarMonth.y, calendarMonth.m)}
                </span>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-background-200 bg-background-50 text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer"
                >
                  <i className="ri-arrow-right-s-line text-sm"></i>
                </button>
              </div>

              {/* Calendar grid */}
              <div className="rounded-xl border border-background-200/80 bg-background-50 overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-background-200/80">
                  {dayAbbrs.map((ab) => (
                    <div
                      key={ab}
                      className="py-2.5 text-center text-[11px] font-bold text-foreground-400 tracking-wider"
                    >
                      {ab}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} className="aspect-square" />;
                    }
                    const dateStr = `${calendarMonth.y}-${pad(calendarMonth.m + 1)}-${pad(day)}`;
                    const isAvailable = slotsByDate.has(dateStr);
                    const isSelected = dateStr === selectedDate;
                    const isPast = dateStr < today;

                    if (!isAvailable || isPast) {
                      return (
                        <div
                          key={dateStr}
                          className="flex flex-col items-center justify-center aspect-square text-foreground-300"
                        >
                          <span className="text-[9px] leading-none opacity-50">
                            {dayAbbrs[idx % 7]}
                          </span>
                          <span className="text-sm font-medium mt-0.5 opacity-40">{day}</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => handleDateClick(dateStr)}
                        className={`flex flex-col items-center justify-center aspect-square transition-all cursor-pointer rounded-lg m-0.5 ${
                          isSelected
                            ? 'bg-primary-500 text-white shadow-sm'
                            : 'bg-accent-50 hover:bg-accent-100 text-foreground-800'
                        }`}
                      >
                        <span
                          className={`text-[9px] leading-none font-semibold ${
                            isSelected ? 'text-white/80' : 'text-accent-500'
                          }`}
                        >
                          {dayAbbrs[idx % 7]}
                        </span>
                        <span className={`text-sm font-bold mt-0.5 ${isSelected ? 'text-white' : 'text-foreground-900'}`}>
                          {day}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========== STEP 1: TIME SLOT SELECTION (ALL DATES) ========== */}
          {step === 1 && (
            <div className="max-w-[540px] mx-auto">
              <div className="text-center mb-6">
                <h3 className="font-heading text-xl font-bold text-foreground-950">
                  {texts.stepTimeTitle}
                </h3>
                <p className="mt-1 text-sm text-foreground-500">
                  {texts.stepTimeDesc}
                </p>
              </div>

              <div
                ref={datesContainerRef}
                className="max-h-[420px] overflow-y-auto space-y-5 pr-1"
              >
                {availableDates.map((dateStr) => {
                  const dateSlots = slotsByDate.get(dateStr) ?? [];
                  const isSelectedDate = dateStr === selectedDate;
                  return (
                    <div
                      key={dateStr}
                      id={`date-section-${dateStr}`}
                      className={`rounded-xl border p-4 transition-colors ${
                        isSelectedDate
                          ? 'border-accent-300 bg-accent-50/50'
                          : 'border-background-200/70 bg-background-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          isSelectedDate
                            ? 'bg-accent-500 text-white'
                            : 'bg-background-100 text-foreground-600'
                        }`}>
                          <i className="ri-calendar-line text-xs"></i>
                        </span>
                        <span className={`text-sm font-bold ${
                          isSelectedDate ? 'text-accent-700' : 'text-foreground-800'
                        }`}>
                          {dateStr}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {dateSlots.map((slot, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSlotClick(slot)}
                            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                              selectedSlot?.start_time === slot.start_time
                                ? 'border-primary-400 bg-primary-500 text-white shadow-sm'
                                : 'border-background-200 bg-background-50 text-foreground-800 hover:border-accent-300 hover:bg-accent-50'
                            }`}
                          >
                            <i
                              className={`ri-time-line text-sm ${
                                selectedSlot?.start_time === slot.start_time ? 'text-white' : 'text-accent-500'
                              }`}
                            ></i>
                            {extractTime(slot.start_time)} – {extractTime(slot.end_time)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={handleModifyTime}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-500 hover:text-primary-600 transition-colors cursor-pointer"
                >
                  <i className="ri-arrow-left-line text-xs"></i>
                  {texts.modifyTime}
                </button>
              </div>
            </div>
          )}

          {/* ========== STEP 2: REVIEW + FORM ========== */}
          {step === 2 && selectedSlot && (
            <div className="max-w-[520px] mx-auto">
              <div className="text-center mb-6">
                <h3 className="font-heading text-xl font-bold text-foreground-950">
                  {texts.stepFormTitle}
                </h3>
                <p className="mt-1 text-sm text-foreground-500">{texts.stepFormDesc}</p>
              </div>

              {/* Review section */}
              <div className="rounded-xl border border-background-200/80 bg-background-50 p-5 mb-6">
                <h4 className="text-sm font-bold text-foreground-800 mb-3">{texts.reviewTitle}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-background-100 px-3.5 py-3">
                    <span className="block text-[11px] font-semibold text-foreground-400 mb-0.5">
                      {texts.reviewDate}
                    </span>
                    <span className="block text-sm font-bold text-foreground-900">
                      {extractDate(selectedSlot.start_time)}
                    </span>
                  </div>
                  <div className="rounded-lg bg-background-100 px-3.5 py-3">
                    <span className="block text-[11px] font-semibold text-foreground-400 mb-0.5">
                      {texts.reviewStart}
                    </span>
                    <span className="block text-sm font-bold text-foreground-900">
                      {extractTime(selectedSlot.start_time)}
                    </span>
                  </div>
                  <div className="rounded-lg bg-background-100 px-3.5 py-3">
                    <span className="block text-[11px] font-semibold text-foreground-400 mb-0.5">
                      {texts.reviewEnd}
                    </span>
                    <span className="block text-sm font-bold text-foreground-900">
                      {extractTime(selectedSlot.end_time)}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleModifyTime}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors cursor-pointer"
                  >
                    <i className="ri-pencil-line text-xs"></i>
                    {texts.modifyTime}
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-sm font-semibold text-foreground-800">
                    {texts.labelName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={texts.placeholderName}
                    className="w-full rounded-md border border-background-200 bg-background-50 px-3.5 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-semibold text-foreground-800">
                    {texts.labelPhone} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder={texts.placeholderPhone}
                    className="w-full rounded-md border border-background-200 bg-background-50 px-3.5 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-semibold text-foreground-800">
                    {texts.labelNotes}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder={texts.placeholderNotes}
                    className="w-full rounded-md border border-background-200 bg-background-50 px-3.5 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 resize-none"
                  ></textarea>
                </div>

                {submitSuccess && (
                  <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 flex items-center gap-2">
                    <i className="ri-checkbox-circle-fill text-base"></i>
                    {texts.successTitle}
                  </div>
                )}

                {submitError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 flex items-center gap-2">
                    <i className="ri-error-warning-fill text-base"></i>
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <i className="ri-loader-4-line animate-spin text-sm"></i>
                      {texts.submitting}
                    </>
                  ) : (
                    <>
                      <i className="ri-calendar-check-line text-sm"></i>
                      {texts.submit}
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}