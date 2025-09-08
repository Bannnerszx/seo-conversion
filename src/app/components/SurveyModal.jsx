"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { X, Star, ChevronLeft, ChevronRight } from "lucide-react"


const questionnaire = [
    {
        title: "About Your Experience",
        questions: [
            {
                id: "q1",
                text: "How easy was it to find what you were looking for?",
                type: "radio",
                options: ["Very Easy", "Easy", "Neutral", "Difficult", "Very Difficult"],
            },
            {
                id: "q2",
                text: "How would you describe the website's design?",
                type: "radio",
                options: ["Excellent", "Good", "Average", "Poor", "Very Poor"],
            },
            {
                id: "q3",
                text: "What brought you to our website today?",
                type: "textarea",
                placeholder: "Please describe your main purpose...",
            },
        ],
    },
    {
        title: "Website Performance",
        questions: [
            {
                id: "q4",
                text: "How fast did the website load for you?",
                type: "radio",
                options: ["Very Fast", "Fast", "Average", "Slow", "Very Slow"],
            },
            {
                id: "q5",
                text: "Did you encounter any technical issues?",
                type: "radio",
                options: ["No issues", "Minor issues", "Some issues", "Major issues", "Site unusable"],
            },
            {
                id: "q6",
                text: "If you experienced issues, please describe them:",
                type: "textarea",
                placeholder: "Describe any problems you encountered...",
            },
        ],
    },
    {
        title: "Future Improvements",
        questions: [
            {
                id: "q7",
                text: "What feature would you most like to see added?",
                type: "textarea",
                placeholder: "Tell us about features you'd find valuable...",
            },
            {
                id: "q8",
                text: "How likely are you to recommend us to others?",
                type: "radio",
                options: ["Very Likely", "Likely", "Neutral", "Unlikely", "Very Unlikely"],
            },
            {
                id: "q9",
                text: "Any additional comments or suggestions?",
                type: "textarea",
                placeholder: "Share any other thoughts...",
            },
        ],
    },
]

export function SurveyModal({ isOpen, onClose }) {
    const [currentPage, setCurrentPage] = useState(0)
    const [answers, setAnswers] = useState({})
    const [rating, setRating] = useState("")
    const [submitted, setSubmitted] = useState(false)

    const isLastPage = currentPage === questionnaire.length
    const currentQuestions = questionnaire[currentPage]

    const handleAnswerChange = (questionId, value) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }))
    }

    const handleNext = () => {
        if (currentPage < questionnaire.length) {
            setCurrentPage((prev) => prev + 1)
        }
    }

    const handlePrevious = () => {
        if (currentPage > 0) {
            setCurrentPage((prev) => prev - 1)
        }
    }

    const handleSubmit = () => {
        // Handle survey submission here
        console.log("Survey submitted:", { answers, rating })
        setSubmitted(true)
        setTimeout(() => {
            onClose()
            setSubmitted(false)
            setCurrentPage(0)
            setAnswers({})
            setRating("")
        }, 2000)
    }

    const resetModal = () => {
        setCurrentPage(0)
        setAnswers({})
        setRating("")
        setSubmitted(false)
        onClose()
    }

    if (!isOpen) return null
    const totalSteps = questionnaire.length + 1; // includes the rating page
    const currentStep = Math.min(currentPage + 1, totalSteps);
    const progressPct = (currentStep / totalSteps) * 100;
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto p-0 sm:p-4">
            <div className="min-h-full flex items-end sm:items-center justify-center">
                <Card className="w-full h-[100dvh] rounded-none sm:h-auto sm:rounded-2xl sm:max-w-md sm:mx-0 mx-0 shadow-2xl border-0 bg-card">
                    <CardHeader className="relative pb-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-foreground p-4"
                            onClick={resetModal}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <CardTitle className="text-xl font-bold text-foreground text-balance">
                            {submitted ? "Thank You!" : isLastPage ? "Final Step" : currentQuestions.title}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground text-pretty">
                            {submitted
                                ? "Your feedback has been submitted."
                                : isLastPage
                                    ? "Please rate your overall experience."
                                    : `Step ${currentPage + 1} of ${questionnaire.length + 1}`}
                        </CardDescription>
                        {!submitted && (
                            <div className="w-full rounded-full h-2 mt-2 bg-gray-200">
                                <div
                                    className="h-2 rounded-full transition-all duration-300 bg-blue-600"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        )}
                    </CardHeader>

                    {!submitted ? (
                        <>
                            <CardContent className="space-y-6 overflow-y-auto max-h-[calc(100dvh-12rem)] sm:max-h-none">
                                {!isLastPage ? (
                                    // Questionnaire pages
                                    <div className="space-y-4">
                                        {currentQuestions.questions.map((question, index) => (
                                            <div key={question.id} className="space-y-3">
                                                <Label className="text-sm font-medium text-foreground">
                                                    {index + 1}. {question.text}
                                                </Label>

                                                {question.type === "radio" ? (
                                                    <RadioGroup
                                                        value={answers[question.id] || ""}
                                                        onValueChange={(value) => handleAnswerChange(question.id, value)}
                                                        className="space-y-2"
                                                    >
                                                        {question.options?.map((option) => (
                                                            <div key={option} className="flex items-center space-x-2">
                                                                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                                                                <Label htmlFor={`${question.id}-${option}`} className="text-sm cursor-pointer">
                                                                    {option}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                ) : (
                                                    <Textarea
                                                        placeholder={question.placeholder}
                                                        value={answers[question.id] || ""}
                                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                        className="min-h-[80px] resize-none bg-input border-border focus:ring-accent"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // Rating page
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-foreground">
                                            How would you rate your overall experience?
                                        </Label>
                                        <div className="flex justify-center gap-2">
                                            {[1, 2, 3, 4, 5].map((value) => (
                                                <button
                                                    key={value}
                                                    onClick={() => setRating(value.toString())}
                                                    className={`p-2 rounded-lg border transition-all ${rating === value.toString()
                                                        ? "bg-accent text-accent-foreground border-accent"
                                                        : "border-border hover:bg-accent/10"
                                                        }`}
                                                >
                                                    <Star
                                                        className={`h-6 w-6 ${rating === value.toString() ? "fill-current" : "text-muted-foreground"
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                                            <span>Poor</span>
                                            <span>Excellent</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="flex gap-3 pt-4">
                                {currentPage > 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={handlePrevious}
                                        className="flex items-center gap-2 border-border text-muted-foreground hover:text-foreground bg-transparent"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                )}

                                {currentPage === 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={resetModal}
                                        className="flex-1 border-border text-muted-foreground hover:text-foreground bg-transparent"
                                    >
                                        Cancel
                                    </Button>
                                )}

                                {!isLastPage ? (
                                    <Button
                                        onClick={handleNext}
                                        className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 flex items-center gap-2"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!rating}
                                        className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                                    >
                                        Submit Survey
                                    </Button>
                                )}
                            </CardFooter>
                        </>
                    ) : (
                        <CardContent className="text-center py-8">
                            <div className="space-y-3">
                                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto">
                                    <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">Thank You!</h3>
                                <p className="text-muted-foreground text-pretty">
                                    Your feedback helps us create a better experience for everyone.
                                </p>
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>

        </div>
    )
}
