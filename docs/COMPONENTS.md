# Component Library Documentation

## Table of Contents

1. [Overview](#overview)
2. [Component Categories](#component-categories)
3. [UI Components](#ui-components)
4. [Chat Components](#chat-components)
5. [Sidebar Components](#sidebar-components)
6. [Utility Components](#utility-components)
7. [Customization](#customization)
8. [Accessibility](#accessibility)
9. [Best Practices](#best-practices)

## Overview

The Chatbot UI Component Library is built on top of Radix UI primitives and styled with Tailwind CSS. It provides a comprehensive set of reusable components designed for building AI chat interfaces with modern design patterns and accessibility features.

### Design System

- **Framework**: Radix UI + Tailwind CSS
- **Styling**: Utility-first CSS with custom design tokens
- **Accessibility**: WCAG 2.1 AA compliant
- **Responsive**: Mobile-first design approach
- **Theming**: Dark/light mode support

### Component Structure

```
components/
├── ui/                    # Base UI components
├── chat/                  # Chat-specific components
├── sidebar/               # Sidebar components
├── messages/              # Message components
├── models/                # Model selection components
├── setup/                 # Setup flow components
├── workspace/             # Workspace components
└── utility/               # Utility components
```

## Component Categories

### 1. UI Components (`components/ui/`)
Base components built on Radix UI primitives with consistent styling.

### 2. Chat Components (`components/chat/`)
Specialized components for chat functionality and AI interactions.

### 3. Sidebar Components (`components/sidebar/`)
Navigation and sidebar management components.

### 4. Message Components (`components/messages/`)
Message display and interaction components.

### 5. Model Components (`components/models/`)
AI model selection and configuration components.

## UI Components

### Accordion

Collapsible content sections with smooth animations.

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Section 1</AccordionTrigger>
    <AccordionContent>Content for section 1</AccordionContent>
  </AccordionItem>
</Accordion>
```

**Props**:
- `type`: "single" | "multiple"
- `collapsible`: boolean
- `defaultValue`: string | string[]
- `value`: string | string[]
- `onValueChange`: (value: string | string[]) => void

### Alert Dialog

Modal dialogs for important actions requiring confirmation.

```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

<AlertDialog>
  <AlertDialogTrigger>Delete Item</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Button

Versatile button component with multiple variants and sizes.

```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="default">
  Click me
</Button>

<Button variant="destructive" size="sm">
  Delete
</Button>

<Button variant="outline" size="lg" disabled>
  Disabled
</Button>
```

**Variants**:
- `default`: Primary button style
- `destructive`: Red button for destructive actions
- `outline`: Bordered button
- `secondary`: Secondary button style
- `ghost`: Transparent button
- `link`: Link-style button

**Sizes**:
- `default`: Standard size
- `sm`: Small size
- `lg`: Large size
- `icon`: Square icon button

### Card

Container component for grouping related content.

```tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Dialog

Modal dialog component for overlays and forms.

```tsx
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form

Form components with validation and error handling.

```tsx
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'

const form = useForm()

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormDescription>Enter your username</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

### Input

Text input component with various types and states.

```tsx
import { Input } from '@/components/ui/input'

<Input type="text" placeholder="Enter text" />
<Input type="email" placeholder="Enter email" />
<Input type="password" placeholder="Enter password" />
<Input type="search" placeholder="Search..." />
```

### Select

Dropdown selection component.

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Textarea

Multi-line text input component.

```tsx
import { Textarea } from '@/components/ui/textarea'

<Textarea placeholder="Enter your message" />
```

### Toast

Notification component for user feedback.

```tsx
import { useToast } from '@/components/ui/use-toast'

const { toast } = useToast()

toast({
  title: "Success",
  description: "Operation completed successfully",
})
```

## Chat Components

### Chat UI

Main chat interface component.

```tsx
import { ChatUI } from '@/components/chat/chat-ui'

<ChatUI
  chatId="chat-123"
  workspaceId="workspace-456"
  messages={messages}
  onSendMessage={handleSendMessage}
/>
```

**Props**:
- `chatId`: string - Current chat ID
- `workspaceId`: string - Current workspace ID
- `messages`: Message[] - Array of messages
- `onSendMessage`: (message: string) => void - Message handler
- `isLoading`: boolean - Loading state
- `error`: string | null - Error state

### Chat Input

Message input component with file upload and formatting.

```tsx
import { ChatInput } from '@/components/chat/chat-input'

<ChatInput
  onSendMessage={handleSendMessage}
  onFileUpload={handleFileUpload}
  placeholder="Type your message..."
  disabled={isLoading}
/>
```

**Props**:
- `onSendMessage`: (message: string) => void
- `onFileUpload`: (file: File) => void
- `placeholder`: string
- `disabled`: boolean
- `maxLength`: number

### Chat Messages

Message display component with markdown rendering.

```tsx
import { ChatMessages } from '@/components/chat/chat-messages'

<ChatMessages
  messages={messages}
  isLoading={isLoading}
  onMessageAction={handleMessageAction}
/>
```

**Props**:
- `messages`: Message[] - Array of messages
- `isLoading`: boolean - Loading state
- `onMessageAction`: (action: string, messageId: string) => void

### Message

Individual message component.

```tsx
import { Message } from '@/components/messages/message'

<Message
  message={message}
  isLast={isLast}
  onAction={handleAction}
/>
```

**Props**:
- `message`: Message - Message object
- `isLast`: boolean - Whether this is the last message
- `onAction`: (action: string) => void - Action handler

### Message Code Block

Code block rendering with syntax highlighting.

```tsx
import { MessageCodeBlock } from '@/components/messages/message-codeblock'

<MessageCodeBlock
  code={code}
  language="typescript"
  filename="example.ts"
/>
```

**Props**:
- `code`: string - Code content
- `language`: string - Programming language
- `filename`: string - Optional filename

### Message Markdown

Markdown rendering component.

```tsx
import { MessageMarkdown } from '@/components/messages/message-markdown'

<MessageMarkdown content={markdownContent} />
```

**Props**:
- `content`: string - Markdown content
- `className`: string - Additional CSS classes

## Sidebar Components

### Sidebar

Main sidebar navigation component.

```tsx
import { Sidebar } from '@/components/sidebar/sidebar'

<Sidebar
  workspaceId="workspace-123"
  onWorkspaceChange={handleWorkspaceChange}
/>
```

**Props**:
- `workspaceId`: string - Current workspace ID
- `onWorkspaceChange`: (workspaceId: string) => void
- `collapsed`: boolean - Sidebar collapsed state

### Sidebar Content

Sidebar content container.

```tsx
import { SidebarContent } from '@/components/sidebar/sidebar-content'

<SidebarContent>
  <SidebarItems />
  <SidebarCreateButtons />
</SidebarContent>
```

### Sidebar Items

Sidebar navigation items.

```tsx
import { SidebarItems } from '@/components/sidebar/sidebar-items'

<SidebarItems
  items={sidebarItems}
  onItemClick={handleItemClick}
/>
```

**Props**:
- `items`: SidebarItem[] - Array of sidebar items
- `onItemClick`: (item: SidebarItem) => void - Click handler

### Chat Item

Individual chat item in sidebar.

```tsx
import { ChatItem } from '@/components/sidebar/items/chat/chat-item'

<ChatItem
  chat={chat}
  isSelected={isSelected}
  onSelect={handleSelect}
  onDelete={handleDelete}
/>
```

**Props**:
- `chat`: Chat - Chat object
- `isSelected`: boolean - Selection state
- `onSelect`: (chatId: string) => void - Selection handler
- `onDelete`: (chatId: string) => void - Delete handler

### Assistant Item

Assistant item in sidebar.

```tsx
import { AssistantItem } from '@/components/sidebar/items/assistants/assistant-item'

<AssistantItem
  assistant={assistant}
  isSelected={isSelected}
  onSelect={handleSelect}
/>
```

**Props**:
- `assistant`: Assistant - Assistant object
- `isSelected`: boolean - Selection state
- `onSelect`: (assistantId: string) => void - Selection handler

## Utility Components

### File Picker

File upload component.

```tsx
import { FilePicker } from '@/components/chat/file-picker'

<FilePicker
  onFileSelect={handleFileSelect}
  acceptedTypes={['.pdf', '.txt', '.docx']}
  maxSize={10 * 1024 * 1024} // 10MB
/>
```

**Props**:
- `onFileSelect`: (file: File) => void - File selection handler
- `acceptedTypes`: string[] - Accepted file types
- `maxSize`: number - Maximum file size in bytes
- `multiple`: boolean - Allow multiple files

### Model Select

AI model selection component.

```tsx
import { ModelSelect } from '@/components/models/model-select'

<ModelSelect
  selectedModel={selectedModel}
  onModelChange={handleModelChange}
  models={availableModels}
/>
```

**Props**:
- `selectedModel`: string - Selected model ID
- `onModelChange`: (modelId: string) => void - Model change handler
- `models`: Model[] - Available models

### Tool Picker

Tool selection component.

```tsx
import { ToolPicker } from '@/components/chat/tool-picker'

<ToolPicker
  selectedTools={selectedTools}
  onToolToggle={handleToolToggle}
  availableTools={availableTools}
/>
```

**Props**:
- `selectedTools`: string[] - Selected tool IDs
- `onToolToggle`: (toolId: string) => void - Tool toggle handler
- `availableTools`: Tool[] - Available tools

## Customization

### Theme Customization

Customize the component library theme by modifying Tailwind CSS variables:

```css
/* tailwind.config.js */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          900: '#0f172a',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
      },
    },
  },
}
```

### Component Variants

Create custom component variants:

```tsx
// Custom button variant
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
        custom: "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### Custom Components

Create custom components extending the base library:

```tsx
// Custom chat message component
interface CustomMessageProps extends MessageProps {
  showTimestamp?: boolean
  showAvatar?: boolean
}

export const CustomMessage: React.FC<CustomMessageProps> = ({
  message,
  showTimestamp = true,
  showAvatar = true,
  ...props
}) => {
  return (
    <div className="custom-message">
      {showAvatar && <MessageAvatar message={message} />}
      <MessageContent message={message} />
      {showTimestamp && <MessageTimestamp message={message} />}
    </div>
  )
}
```

## Accessibility

### ARIA Labels

All components include proper ARIA labels and roles:

```tsx
<Button aria-label="Delete chat">
  <TrashIcon />
</Button>

<Input aria-describedby="email-help" />
<div id="email-help">Enter your email address</div>
```

### Keyboard Navigation

Components support full keyboard navigation:

```tsx
// Tab navigation
<TabGroup>
  <TabList>
    <Tab>Tab 1</Tab>
    <Tab>Tab 2</Tab>
  </TabList>
  <TabPanels>
    <TabPanel>Content 1</TabPanel>
    <TabPanel>Content 2</TabPanel>
  </TabPanels>
</TabGroup>
```

### Focus Management

Proper focus management for modals and overlays:

```tsx
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    {/* Focus is automatically managed */}
    <DialogTitle>Title</DialogTitle>
    <DialogDescription>Description</DialogDescription>
  </DialogContent>
</Dialog>
```

### Screen Reader Support

Components include screen reader announcements:

```tsx
<Alert role="alert" aria-live="polite">
  Message sent successfully
</Alert>
```

## Best Practices

### 1. Component Composition

Use composition over inheritance:

```tsx
// Good: Composition
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Avoid: Custom wrapper
<CustomCard title="Title" content="Content" />
```

### 2. Props Interface

Define clear prop interfaces:

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}
```

### 3. Error Boundaries

Wrap components in error boundaries:

```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <ChatMessages messages={messages} />
</ErrorBoundary>
```

### 4. Performance Optimization

Use React.memo for expensive components:

```tsx
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  return <div>{/* Expensive rendering */}</div>
})
```

### 5. Testing

Write comprehensive tests for components:

```tsx
describe('Button', () => {
  it('renders with correct variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### 6. Documentation

Document component usage with examples:

```tsx
/**
 * Chat message component for displaying user and AI messages
 * 
 * @example
 * ```tsx
 * <Message
 *   message={{ role: 'user', content: 'Hello' }}
 *   isLast={true}
 *   onAction={handleAction}
 * />
 * ```
 */
export const Message: React.FC<MessageProps> = ({ message, isLast, onAction }) => {
  // Component implementation
}
```

---

**Last Updated**: December 2024  
**Version**: 2.0.0  
**Status**: Complete
