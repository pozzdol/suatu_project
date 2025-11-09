import { ArrowUUpLeftIcon, LockKeyIcon } from "@phosphor-icons/react";

function Permit() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-2xl p-8 md:p-12 max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-100 rounded-full animate-pulse"></div>
            <div className="relative bg-rose-50 rounded-full p-4 border-2 border-rose-200">
              <LockKeyIcon
                size={64}
                className="text-rose-500"
                weight="duotone"
              />
            </div>
          </div>
        </div>

        <h1 className="text-xl md:text-4xl font-bold bg-gradient-to-r from-rose-600 to-rose-500 bg-clip-text text-transparent mb-3">
          Access Denied
        </h1>

        <p className="text-gray-600 text-base mb-6 leading-relaxed">
          You do not have permission to view this page.
        </p>

        <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-2 mb-6">
          <p className="text-sm text-rose-700">
            If you believe this is a mistake, please contact your administrator.
          </p>
        </div>

        <a
          href="/app"
          className="inline-block bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 transform active:scale-95"
        >
          Go Back to Dashboard{" "}
          <ArrowUUpLeftIcon
            size={20}
            weight="duotone"
            className="inline-block ml-2"
          />
        </a>
      </div>
    </div>
  );
}

export default Permit;
