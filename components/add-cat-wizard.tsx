"use client"

import { ArrowLeft, Check, Upload, MapPin } from "lucide-react"
import { useState } from "react"

interface AddCatWizardProps {
  onClose: () => void
}

export default function AddCatWizard({ onClose }: AddCatWizardProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    photo: null as string | null,
    color: "",
    size: "",
    behavior: [] as string[],
    location: "",
    name: "",
  })

  const colors = ["Orange", "Black", "White", "Gray", "Brown", "Mixed"]
  const sizes = ["Kitten", "Small", "Medium", "Large"]
  const behaviors = ["Friendly", "Shy", "Playful", "Calm", "Aggressive", "Nocturnal"]

  const toggleBehavior = (behavior: string) => {
    setFormData((prev) => ({
      ...prev,
      behavior: prev.behavior.includes(behavior)
        ? prev.behavior.filter((b) => b !== behavior)
        : [...prev.behavior, behavior],
    }))
  }

  const handleNext = () => {
    if (step < 5) setStep(step + 1)
    else handleSubmit()
  }

  const handleSubmit = () => {
    console.log("Cat added:", formData)
    onClose()
  }

  const isStepValid = () => {
    if (step === 1) return formData.photo !== null
    if (step === 2) return formData.color !== ""
    if (step === 3) return formData.behavior.length > 0
    if (step === 4) return formData.location !== ""
    return true
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end safe-area-inset-bottom">
      <div className="w-full bg-card rounded-t-3xl p-6 animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-foreground">Add a Cat</h2>
          <div className="w-10 text-center text-sm font-medium text-muted-foreground">{step}/5</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-1 mb-6">
          <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${(step / 5) * 100}%` }} />
        </div>

        {/* Step 1: Photo */}
        {step === 1 && (
          <div>
            <h3 className="font-semibold text-foreground mb-4">Upload a Photo</h3>
            <button className="w-full border-2 border-dashed border-border rounded-2xl py-12 hover:bg-muted transition-colors text-center">
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Tap to upload photo</p>
              <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
            </button>
          </div>
        )}

        {/* Step 2: Appearance */}
        {step === 2 && (
          <div>
            <h3 className="font-semibold text-foreground mb-4">Appearance</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Color</p>
                <div className="grid grid-cols-3 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData((prev) => ({ ...prev, color }))}
                      className={`p-3 rounded-lg font-medium text-sm transition-colors ${
                        formData.color === color
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">Size</p>
                <div className="grid grid-cols-2 gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setFormData((prev) => ({ ...prev, size }))}
                      className={`p-3 rounded-lg font-medium text-sm transition-colors ${
                        formData.size === size
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Behavior */}
        {step === 3 && (
          <div>
            <h3 className="font-semibold text-foreground mb-4">Behavior & Traits</h3>
            <div className="flex flex-wrap gap-2">
              {behaviors.map((behavior) => (
                <button
                  key={behavior}
                  onClick={() => toggleBehavior(behavior)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    formData.behavior.includes(behavior)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {behavior}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Location */}
        {step === 4 && (
          <div>
            <h3 className="font-semibold text-foreground mb-4">Location</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-4 border border-border rounded-xl hover:bg-muted transition-colors">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Use Current Location</p>
                  <p className="text-xs text-muted-foreground">San Francisco, CA</p>
                </div>
              </button>
              <input
                type="text"
                placeholder="Or enter location manually"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 bg-input border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* Step 5: Name */}
        {step === 5 && (
          <div>
            <h3 className="font-semibold text-foreground mb-4">Give Your Cat a Name</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Optional - community can vote on names for unnamed cats
            </p>
            <input
              type="text"
              placeholder="e.g., Luna, Whiskers, Shadow..."
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-input border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary mb-4"
            />
            <button className="w-full p-3 bg-muted text-foreground rounded-xl font-medium">
              Let the community decide
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setStep(step > 1 ? step - 1 : step)}
            disabled={step === 1}
            className="flex-1 border border-border text-foreground rounded-xl py-3 font-semibold hover:bg-muted transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {step === 5 ? (
              <>
                <Check className="w-4 h-4" />
                Submit
              </>
            ) : (
              "Next"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
