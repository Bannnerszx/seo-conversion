export default function LoadingSkeleton() {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar skeleton */}
        <aside className="w-full lg:max-w-[350px] border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            {/* Search or header placeholder */}
            <div className="h-10 bg-gray-200 rounded-md animate-pulse mb-4"></div>
  
            {/* Transaction list items */}
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-3 mb-2 border-b border-gray-100">
                {/* Avatar placeholder */}
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="flex-1">
                  {/* Name placeholder */}
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4"></div>
                  {/* Message placeholder */}
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
                {/* Time or status placeholder */}
                <div className="h-3 bg-gray-200 rounded animate-pulse w-10"></div>
              </div>
            ))}
          </div>
        </aside>
  
        {/* Main content skeleton */}
        <main className="hidden lg:block w-full h-full overflow-y-auto">
          <div className="h-full flex flex-col">
            {/* Header placeholder */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                </div>
              </div>
            </div>
  
            {/* Messages container */}
            <div className="flex-1 p-4 space-y-4">
              {/* Message bubbles */}
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`rounded-lg p-3 max-w-[70%] w-[300px] ${
                      index % 2 === 0 ? "bg-gray-200" : "bg-gray-300"
                    } animate-pulse h-16`}
                  ></div>
                </div>
              ))}
            </div>
  
            {/* Input placeholder */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-10 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }
  
  