export const UILoadingSkeleton = (count = 3) => {
  let skeletons = '';
  for(let i=0; i<count; i++) {
    skeletons += `
      <div class="bg-[#0a0505] rounded-xl border border-gray-800 overflow-hidden animate-pulse">
        <div class="h-48 bg-gray-900/50"></div>
        <div class="p-5 space-y-4">
          <div class="h-4 bg-gray-800 rounded w-1/3"></div>
          <div class="h-6 bg-gray-800 rounded w-3/4"></div>
          <div class="space-y-2">
            <div class="h-3 bg-gray-900 rounded"></div>
            <div class="h-3 bg-gray-900 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    `;
  }
  return skeletons;
};

export const UISpinner = (text = "جاري الاستحضار...") => `
  <div class="flex flex-col items-center justify-center py-10 w-full col-span-full">
    <div class="relative w-12 h-12 flex items-center justify-center mb-4">
      <div class="absolute inset-0 border-2 border-red-900/30 border-t-red-600 rounded-full animate-spin"></div>
      <i class="fa-solid fa-ghost text-red-500/50 text-sm animate-pulse"></i>
    </div>
    <p class="text-gray-500 font-semibold text-sm">${text}</p>
  </div>
`;

export const UIEmptyState = (message = "لا يوجد محتوى حالياً", icon = "fa-spider") => `
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center w-full col-span-full bg-[#0a0505]/50 rounded-2xl border border-gray-800/50 border-dashed">
    <div class="w-20 h-20 mb-6 rounded-full bg-black/50 border border-gray-800 flex items-center justify-center shadow-inner">
      <i class="fa-solid ${icon} text-3xl text-gray-600 opacity-50"></i>
    </div>
    <h3 class="text-xl font-bold text-gray-300 mb-2">لا يوجد شيء هنا</h3>
    <p class="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">${message}</p>
  </div>
`;

export const UIErrorState = (message = "حدث خطأ في الاتصال", retryId = "btn-retry") => `
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center w-full col-span-full bg-red-950/10 rounded-2xl border border-red-900/20">
    <div class="w-16 h-16 mb-4 rounded-full bg-red-900/20 flex items-center justify-center text-red-500">
      <i class="fa-solid fa-triangle-exclamation text-2xl"></i>
    </div>
    <h3 class="text-lg font-bold text-red-400 mb-2">حدث خطأ</h3>
    <p class="text-gray-500 text-sm mb-6 max-w-sm">${message}</p>
    <button id="${retryId}" class="px-6 py-2.5 bg-[#0a0505] hover:bg-red-950/30 border border-red-900/50 hover:border-red-600 text-red-400 rounded-lg transition-all text-sm font-bold flex items-center gap-2 group focus:outline-none">
      <i class="fa-solid fa-rotate-right group-hover:rotate-180 transition-transform duration-500"></i> حاول مرة أخرى
    </button>
  </div>
`;

export const UISuccessState = (message = "تمت العملية بنجاح!") => `
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center w-full col-span-full bg-green-950/10 rounded-2xl border border-green-900/20">
    <div class="w-16 h-16 mb-4 rounded-full bg-green-900/20 flex items-center justify-center text-green-500">
      <i class="fa-solid fa-circle-check text-2xl"></i>
    </div>
    <h3 class="text-lg font-bold text-green-400 mb-2">نجاح</h3>
    <p class="text-gray-400 text-sm max-w-sm">${message}</p>
  </div>
`;
