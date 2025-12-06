export default function Loading() {
  return (
    <div className='fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-slate-950/90 backdrop-blur-md text-white'>
      <div className='flex flex-col items-center gap-6 text-center'>
        <div className='relative h-16 w-16' aria-hidden='true'>
          <span className='absolute inset-0 rounded-full border-4 border-slate-800/70' />
          <span className='absolute inset-0 rounded-full border-4 border-transparent border-t-sky-400 animate-spin [animation-duration:1s]' />
          <span className='absolute inset-2 rounded-full border-2 border-transparent border-b-cyan-300 animate-spin [animation-duration:1.4s]' />
        </div>
        <div>
          <p className='text-xl font-semibold tracking-wide'>
            拼便宜商品运营Agent
          </p>
          <p className='mt-1 text-sm text-slate-200/80'>
            正在加载核心资源，请稍候...
          </p>
        </div>
      </div>
    </div>
  );
}
