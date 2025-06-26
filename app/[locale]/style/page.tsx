"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Palette,
  Type,
  Layout,
  Eye,
  Save,
  RotateCcw,
  Sparkles,
  Moon,
  Sun,
  Monitor,
  Settings,
  Paintbrush,
  Grid,
  Layers
} from "lucide-react"

interface StyleSettings {
  // Colors
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  mutedColor: string

  // Typography
  fontFamily: string
  fontSize: number
  lineHeight: number
  fontWeight: number

  // Spacing
  borderRadius: number
  padding: number
  margin: number
  gap: number

  // Effects
  shadowIntensity: number
  blurIntensity: number
  opacity: number

  // Layout
  maxWidth: number
  containerPadding: number

  // Theme
  theme: "light" | "dark" | "auto"
  enableAnimations: boolean
  enableGradients: boolean
  enableShadows: boolean
}

const defaultSettings: StyleSettings = {
  primaryColor: "#3b82f6",
  secondaryColor: "#64748b",
  accentColor: "#f59e0b",
  backgroundColor: "#ffffff",
  surfaceColor: "#f8fafc",
  textColor: "#1e293b",
  mutedColor: "#64748b",

  fontFamily: "Inter",
  fontSize: 16,
  lineHeight: 1.5,
  fontWeight: 400,

  borderRadius: 8,
  padding: 16,
  margin: 16,
  gap: 16,

  shadowIntensity: 0.1,
  blurIntensity: 0,
  opacity: 1,

  maxWidth: 1200,
  containerPadding: 24,

  theme: "auto",
  enableAnimations: true,
  enableGradients: false,
  enableShadows: true
}

const fontOptions = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Poppins", label: "Poppins" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Source Sans Pro", label: "Source Sans Pro" },
  { value: "Nunito", label: "Nunito" }
]

export default function StylePage() {
  const [settings, setSettings] = useState<StyleSettings>(defaultSettings)
  const [previewMode, setPreviewMode] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop")

  useEffect(() => {
    // Load saved settings from localStorage
    const saved = localStorage.getItem("style-settings")
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) })
      } catch (error) {
        console.error("Failed to load style settings:", error)
      }
    }
  }, [])

  useEffect(() => {
    // Apply settings to CSS custom properties
    const root = document.documentElement

    // Colors
    root.style.setProperty("--primary-color", settings.primaryColor)
    root.style.setProperty("--secondary-color", settings.secondaryColor)
    root.style.setProperty("--accent-color", settings.accentColor)
    root.style.setProperty("--background-color", settings.backgroundColor)
    root.style.setProperty("--surface-color", settings.surfaceColor)
    root.style.setProperty("--text-color", settings.textColor)
    root.style.setProperty("--muted-color", settings.mutedColor)

    // Typography
    root.style.setProperty("--font-family", settings.fontFamily)
    root.style.setProperty("--font-size", `${settings.fontSize}px`)
    root.style.setProperty("--line-height", settings.lineHeight.toString())
    root.style.setProperty("--font-weight", settings.fontWeight.toString())

    // Spacing
    root.style.setProperty("--border-radius", `${settings.borderRadius}px`)
    root.style.setProperty("--padding", `${settings.padding}px`)
    root.style.setProperty("--margin", `${settings.margin}px`)
    root.style.setProperty("--gap", `${settings.gap}px`)

    // Effects
    root.style.setProperty(
      "--shadow-intensity",
      settings.shadowIntensity.toString()
    )
    root.style.setProperty("--blur-intensity", `${settings.blurIntensity}px`)
    root.style.setProperty("--opacity", settings.opacity.toString())

    // Layout
    root.style.setProperty("--max-width", `${settings.maxWidth}px`)
    root.style.setProperty(
      "--container-padding",
      `${settings.containerPadding}px`
    )

    // Theme
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark")
    } else if (settings.theme === "light") {
      document.documentElement.classList.remove("dark")
    }

    // Animations
    if (!settings.enableAnimations) {
      root.style.setProperty("--animation-duration", "0s")
    } else {
      root.style.setProperty("--animation-duration", "0.2s")
    }

    // Save to localStorage
    localStorage.setItem("style-settings", JSON.stringify(settings))
  }, [settings])

  const updateSetting = (key: keyof StyleSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "style-settings.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = e => {
        try {
          const imported = JSON.parse(e.target?.result as string)
          setSettings({ ...defaultSettings, ...imported })
        } catch (error) {
          console.error("Failed to import settings:", error)
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-3">
              <Paintbrush className="size-8 text-white" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
                Style Customization
              </h1>
              <p className="text-muted-foreground">
                Customize the look and feel of your application
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={resetSettings}>
              <RotateCcw className="mr-2 size-4" />
              Reset
            </Button>
            <Button onClick={exportSettings}>
              <Save className="mr-2 size-4" />
              Export
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
              id="import-settings"
            />
            <Button
              variant="outline"
              onClick={() =>
                document.getElementById("import-settings")?.click()
              }
            >
              Import
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Settings Panel */}
          <div className="space-y-6 lg:col-span-2">
            <Tabs defaultValue="colors" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger
                  value="colors"
                  className="flex items-center space-x-2"
                >
                  <Palette className="size-4" />
                  <span>Colors</span>
                </TabsTrigger>
                <TabsTrigger
                  value="typography"
                  className="flex items-center space-x-2"
                >
                  <Type className="size-4" />
                  <span>Typography</span>
                </TabsTrigger>
                <TabsTrigger
                  value="layout"
                  className="flex items-center space-x-2"
                >
                  <Layout className="size-4" />
                  <span>Layout</span>
                </TabsTrigger>
                <TabsTrigger
                  value="effects"
                  className="flex items-center space-x-2"
                >
                  <Sparkles className="size-4" />
                  <span>Effects</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <div className="size-4 rounded-full bg-blue-500"></div>
                        <span>Primary Colors</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary-color">Primary Color</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="primary-color"
                            type="color"
                            value={settings.primaryColor}
                            onChange={e =>
                              updateSetting("primaryColor", e.target.value)
                            }
                            className="h-10 w-16"
                          />
                          <Input
                            value={settings.primaryColor}
                            onChange={e =>
                              updateSetting("primaryColor", e.target.value)
                            }
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondary-color">Secondary Color</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="secondary-color"
                            type="color"
                            value={settings.secondaryColor}
                            onChange={e =>
                              updateSetting("secondaryColor", e.target.value)
                            }
                            className="h-10 w-16"
                          />
                          <Input
                            value={settings.secondaryColor}
                            onChange={e =>
                              updateSetting("secondaryColor", e.target.value)
                            }
                            placeholder="#64748b"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accent-color">Accent Color</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="accent-color"
                            type="color"
                            value={settings.accentColor}
                            onChange={e =>
                              updateSetting("accentColor", e.target.value)
                            }
                            className="h-10 w-16"
                          />
                          <Input
                            value={settings.accentColor}
                            onChange={e =>
                              updateSetting("accentColor", e.target.value)
                            }
                            placeholder="#f59e0b"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <div className="size-4 rounded-full bg-gray-500"></div>
                        <span>Background Colors</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="background-color">
                          Background Color
                        </Label>
                        <div className="flex space-x-2">
                          <Input
                            id="background-color"
                            type="color"
                            value={settings.backgroundColor}
                            onChange={e =>
                              updateSetting("backgroundColor", e.target.value)
                            }
                            className="h-10 w-16"
                          />
                          <Input
                            value={settings.backgroundColor}
                            onChange={e =>
                              updateSetting("backgroundColor", e.target.value)
                            }
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="surface-color">Surface Color</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="surface-color"
                            type="color"
                            value={settings.surfaceColor}
                            onChange={e =>
                              updateSetting("surfaceColor", e.target.value)
                            }
                            className="h-10 w-16"
                          />
                          <Input
                            value={settings.surfaceColor}
                            onChange={e =>
                              updateSetting("surfaceColor", e.target.value)
                            }
                            placeholder="#f8fafc"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="text-color">Text Color</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="text-color"
                            type="color"
                            value={settings.textColor}
                            onChange={e =>
                              updateSetting("textColor", e.target.value)
                            }
                            className="h-10 w-16"
                          />
                          <Input
                            value={settings.textColor}
                            onChange={e =>
                              updateSetting("textColor", e.target.value)
                            }
                            placeholder="#1e293b"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="typography" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Typography Settings</CardTitle>
                    <CardDescription>
                      Customize fonts, sizes, and spacing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="font-family">Font Family</Label>
                        <Select
                          value={settings.fontFamily}
                          onValueChange={value =>
                            updateSetting("fontFamily", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontOptions.map(font => (
                              <SelectItem key={font.value} value={font.value}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="font-size">Font Size (px)</Label>
                        <div className="flex items-center space-x-2">
                          <Slider
                            value={[settings.fontSize]}
                            onValueChange={([value]) =>
                              updateSetting("fontSize", value)
                            }
                            min={12}
                            max={24}
                            step={1}
                            className="flex-1"
                          />
                          <Input
                            value={settings.fontSize}
                            onChange={e =>
                              updateSetting(
                                "fontSize",
                                parseInt(e.target.value) || 16
                              )
                            }
                            className="w-20"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="line-height">Line Height</Label>
                        <div className="flex items-center space-x-2">
                          <Slider
                            value={[settings.lineHeight]}
                            onValueChange={([value]) =>
                              updateSetting("lineHeight", value)
                            }
                            min={1}
                            max={2}
                            step={0.1}
                            className="flex-1"
                          />
                          <Input
                            value={settings.lineHeight}
                            onChange={e =>
                              updateSetting(
                                "lineHeight",
                                parseFloat(e.target.value) || 1.5
                              )
                            }
                            className="w-20"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="font-weight">Font Weight</Label>
                        <div className="flex items-center space-x-2">
                          <Slider
                            value={[settings.fontWeight]}
                            onValueChange={([value]) =>
                              updateSetting("fontWeight", value)
                            }
                            min={300}
                            max={700}
                            step={100}
                            className="flex-1"
                          />
                          <Input
                            value={settings.fontWeight}
                            onChange={e =>
                              updateSetting(
                                "fontWeight",
                                parseInt(e.target.value) || 400
                              )
                            }
                            className="w-20"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="layout" className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Spacing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="border-radius">
                          Border Radius (px)
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Slider
                            value={[settings.borderRadius]}
                            onValueChange={([value]) =>
                              updateSetting("borderRadius", value)
                            }
                            min={0}
                            max={24}
                            step={1}
                            className="flex-1"
                          />
                          <Input
                            value={settings.borderRadius}
                            onChange={e =>
                              updateSetting(
                                "borderRadius",
                                parseInt(e.target.value) || 8
                              )
                            }
                            className="w-20"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="padding">Padding (px)</Label>
                        <div className="flex items-center space-x-2">
                          <Slider
                            value={[settings.padding]}
                            onValueChange={([value]) =>
                              updateSetting("padding", value)
                            }
                            min={8}
                            max={32}
                            step={2}
                            className="flex-1"
                          />
                          <Input
                            value={settings.padding}
                            onChange={e =>
                              updateSetting(
                                "padding",
                                parseInt(e.target.value) || 16
                              )
                            }
                            className="w-20"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gap">Gap (px)</Label>
                        <div className="flex items-center space-x-2">
                          <Slider
                            value={[settings.gap]}
                            onValueChange={([value]) =>
                              updateSetting("gap", value)
                            }
                            min={4}
                            max={32}
                            step={2}
                            className="flex-1"
                          />
                          <Input
                            value={settings.gap}
                            onChange={e =>
                              updateSetting(
                                "gap",
                                parseInt(e.target.value) || 16
                              )
                            }
                            className="w-20"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Container</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="max-width">Max Width (px)</Label>
                        <div className="flex items-center space-x-2">
                          <Slider
                            value={[settings.maxWidth]}
                            onValueChange={([value]) =>
                              updateSetting("maxWidth", value)
                            }
                            min={800}
                            max={1600}
                            step={50}
                            className="flex-1"
                          />
                          <Input
                            value={settings.maxWidth}
                            onChange={e =>
                              updateSetting(
                                "maxWidth",
                                parseInt(e.target.value) || 1200
                              )
                            }
                            className="w-20"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="container-padding">
                          Container Padding (px)
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Slider
                            value={[settings.containerPadding]}
                            onValueChange={([value]) =>
                              updateSetting("containerPadding", value)
                            }
                            min={16}
                            max={64}
                            step={4}
                            className="flex-1"
                          />
                          <Input
                            value={settings.containerPadding}
                            onChange={e =>
                              updateSetting(
                                "containerPadding",
                                parseInt(e.target.value) || 24
                              )
                            }
                            className="w-20"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="effects" className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Visual Effects</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="shadow-intensity">
                          Shadow Intensity
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Slider
                            value={[settings.shadowIntensity]}
                            onValueChange={([value]) =>
                              updateSetting("shadowIntensity", value)
                            }
                            min={0}
                            max={0.5}
                            step={0.01}
                            className="flex-1"
                          />
                          <Input
                            value={settings.shadowIntensity}
                            onChange={e =>
                              updateSetting(
                                "shadowIntensity",
                                parseFloat(e.target.value) || 0.1
                              )
                            }
                            className="w-20"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="blur-intensity">
                          Blur Intensity (px)
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Slider
                            value={[settings.blurIntensity]}
                            onValueChange={([value]) =>
                              updateSetting("blurIntensity", value)
                            }
                            min={0}
                            max={20}
                            step={1}
                            className="flex-1"
                          />
                          <Input
                            value={settings.blurIntensity}
                            onChange={e =>
                              updateSetting(
                                "blurIntensity",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="opacity">Opacity</Label>
                        <div className="flex items-center space-x-2">
                          <Slider
                            value={[settings.opacity]}
                            onValueChange={([value]) =>
                              updateSetting("opacity", value)
                            }
                            min={0.1}
                            max={1}
                            step={0.1}
                            className="flex-1"
                          />
                          <Input
                            value={settings.opacity}
                            onChange={e =>
                              updateSetting(
                                "opacity",
                                parseFloat(e.target.value) || 1
                              )
                            }
                            className="w-20"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Features</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Theme</Label>
                          <p className="text-muted-foreground text-sm">
                            Choose your preferred theme
                          </p>
                        </div>
                        <Select
                          value={settings.theme}
                          onValueChange={(value: "light" | "dark" | "auto") =>
                            updateSetting("theme", value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">
                              <div className="flex items-center space-x-2">
                                <Sun className="size-4" />
                                <span>Light</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="dark">
                              <div className="flex items-center space-x-2">
                                <Moon className="size-4" />
                                <span>Dark</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="auto">
                              <div className="flex items-center space-x-2">
                                <Monitor className="size-4" />
                                <span>Auto</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Animations</Label>
                          <p className="text-muted-foreground text-sm">
                            Enable smooth transitions
                          </p>
                        </div>
                        <Switch
                          checked={settings.enableAnimations}
                          onCheckedChange={checked =>
                            updateSetting("enableAnimations", checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Gradients</Label>
                          <p className="text-muted-foreground text-sm">
                            Use gradient backgrounds
                          </p>
                        </div>
                        <Switch
                          checked={settings.enableGradients}
                          onCheckedChange={checked =>
                            updateSetting("enableGradients", checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Shadows</Label>
                          <p className="text-muted-foreground text-sm">
                            Enable shadow effects
                          </p>
                        </div>
                        <Switch
                          checked={settings.enableShadows}
                          onCheckedChange={checked =>
                            updateSetting("enableShadows", checked)
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="size-5" />
                  <span>Preview</span>
                </CardTitle>
                <CardDescription>See your changes in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex space-x-2">
                  <Button
                    variant={previewMode === "desktop" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewMode("desktop")}
                  >
                    <Monitor className="size-4" />
                  </Button>
                  <Button
                    variant={previewMode === "tablet" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewMode("tablet")}
                  >
                    <Grid className="size-4" />
                  </Button>
                  <Button
                    variant={previewMode === "mobile" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewMode("mobile")}
                  >
                    <Layers className="size-4" />
                  </Button>
                </div>

                <div
                  className={`
                  rounded-lg border-2 border-dashed border-gray-300 p-4 transition-all duration-300
                  ${previewMode === "desktop" ? "w-full" : previewMode === "tablet" ? "mx-auto w-80" : "mx-auto w-64"}
                `}
                >
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className="size-8 rounded-lg"
                        style={{ backgroundColor: settings.primaryColor }}
                      ></div>
                      <h3
                        className="font-semibold"
                        style={{ color: settings.textColor }}
                      >
                        Sample Component
                      </h3>
                    </div>

                    <div
                      className="rounded-lg p-4"
                      style={{
                        backgroundColor: settings.surfaceColor,
                        borderRadius: `${settings.borderRadius}px`,
                        boxShadow: settings.enableShadows
                          ? `0 4px 6px rgba(0, 0, 0, ${settings.shadowIntensity})`
                          : "none"
                      }}
                    >
                      <p
                        style={{
                          color: settings.textColor,
                          fontSize: `${settings.fontSize}px`,
                          lineHeight: settings.lineHeight,
                          fontFamily: settings.fontFamily
                        }}
                      >
                        This is a preview of how your content will look with the
                        current settings.
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Badge
                        style={{
                          backgroundColor: settings.primaryColor,
                          color: "white"
                        }}
                      >
                        Primary
                      </Badge>
                      <Badge
                        style={{
                          backgroundColor: settings.secondaryColor,
                          color: "white"
                        }}
                      >
                        Secondary
                      </Badge>
                      <Badge
                        style={{
                          backgroundColor: settings.accentColor,
                          color: "white"
                        }}
                      >
                        Accent
                      </Badge>
                    </div>

                    <Button
                      className="w-full"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      Sample Button
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CSS Variables</CardTitle>
                <CardDescription>
                  Generated CSS custom properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-64 overflow-auto rounded bg-gray-100 p-3 text-xs dark:bg-gray-800">
                  {`:root {
  --primary-color: ${settings.primaryColor};
  --secondary-color: ${settings.secondaryColor};
  --accent-color: ${settings.accentColor};
  --background-color: ${settings.backgroundColor};
  --surface-color: ${settings.surfaceColor};
  --text-color: ${settings.textColor};
  --muted-color: ${settings.mutedColor};
  --font-family: ${settings.fontFamily};
  --font-size: ${settings.fontSize}px;
  --line-height: ${settings.lineHeight};
  --font-weight: ${settings.fontWeight};
  --border-radius: ${settings.borderRadius}px;
  --padding: ${settings.padding}px;
  --margin: ${settings.margin}px;
  --gap: ${settings.gap}px;
  --shadow-intensity: ${settings.shadowIntensity};
  --blur-intensity: ${settings.blurIntensity}px;
  --opacity: ${settings.opacity};
  --max-width: ${settings.maxWidth}px;
  --container-padding: ${settings.containerPadding}px;
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
