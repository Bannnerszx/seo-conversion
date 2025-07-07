import { X } from 'lucide-react'

export function FilterBubble({ label, value, category, onRemove }) {
    // Different colors for different categories
    const bgColor =
        category === 'cars' ? 'bg-blue-50 text-blue-800' : 'bg-purple-50 text-purple-800'

    return (
        <div className={`inline-flex items-center ${bgColor} rounded-full px-3 py-1 text-sm mr-2 mb-2`}>
            <span className="mr-1 font-medium">{label.toUpperCase()}:</span>
            <span>{decodeURIComponent(value.toUpperCase())}</span>
            <button
                onClick={onRemove}
                className="ml-2 rounded-full p-0.5 hover:bg-blue-100"
                aria-label={`Remove ${label} filter`}
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    )
}

export function SelectedFilters({
    carFilters,
    calculatorFilters,
    inspection,
    insurance,
    onRemoveCarFilter,
    onRemoveCalculatorFilter,
    onToggleInspection,
    onToggleInsurance,
    handleSearch
}) {
    const hasCarFilters = Object.entries(carFilters).some(
        ([, value]) => value && value !== 'none'
    )
    const hasCalculatorFilters = Object.entries(calculatorFilters).some(
        ([, value]) => value && value !== 'none'
    )
    const hasFilters = hasCarFilters || hasCalculatorFilters || inspection || insurance

    if (!hasFilters) return null

    return (
        <div className="">
            <div className="flex flex-wrap">
                {/* Car search filters */}
                {Object.entries(carFilters).map(([key, value]) => {
                    if (!value || value === 'none') return null

                    // Get display value from the original value
                    let displayValue = value
                    if (key === 'Select Make' || key === 'Select Model') {
                        displayValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
                    }

                    return (
                        <FilterBubble
                            key={`car-${key}`}
                            label={key.replace('Select ', '')}
                            value={displayValue}
                            category="cars"
                            onRemove={() => {
                                onRemoveCarFilter(key); 
                            }}
                        />
                    )
                })}

                {/* Price calculator filters */}
                {Object.entries(calculatorFilters).map(([key, value]) => {
                    if (!value || value === 'none') return null

                    // Format country name for display
                    let displayValue = value
                    if (key === 'Select Country' && value === 'D_R_Congo') {
                        displayValue = 'D.R. Congo'
                    }

                    return (
                        <FilterBubble
                            key={`loc-${key}`}
                            label={key.replace('Select ', '')}
                            value={displayValue}
                            category="calculator"
                            onRemove={() => onRemoveCalculatorFilter(key)}
                        />
                    )
                })}

                {/* Show inspection and insurance if enabled */}
                {inspection && (
                    <FilterBubble
                        label="Inspection"
                        value="Enabled"
                        category="calculator"
                        onRemove={onToggleInspection}
                    />
                )}

                {insurance && (
                    <FilterBubble
                        label="Insurance"
                        value="Enabled"
                        category="calculator"
                        onRemove={onToggleInsurance}
                    />
                )}
            </div>
        </div>
    )
}
