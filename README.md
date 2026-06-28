FIXNOW 

![FIXNOW](https://ik.imagekit.io/smr2007/fixnow-logo.png)

# Overview

FIXNOW is an AI-powered home services marketplace that transforms the traditional technician booking experience into an intelligent, automated, and highly personalized platform.

Instead of requiring customers to manually search for technicians, describe technical issues, negotiate pricing, and coordinate service requests, FIXNOW leverages Artificial Intelligence to diagnose problems, identify the required service category, recommend the most suitable technician, estimate repair costs, streamline bookings, and securely manage digital payments.

The platform integrates **CascadeFlow AI orchestration**, **Hindsight Memory**, **Computer Vision**, **OCR**, **Voice AI**, **Firebase**, **Google Maps**, **Socket.IO**, and **Razorpay** to provide a seamless end-to-end service experience.

FIXNOW serves three primary stakeholders:

* Customers
* Technicians
* Administrators

---

# Core Objectives

* Eliminate uncertainty during technician selection.
* Diagnose household problems using Artificial Intelligence.
* Match customers with the most suitable technician.
* Reduce fake bookings through secure booking advance payments.
* Improve technician productivity using intelligent dispatching.
* Deliver personalized AI assistance with contextual memory.
* Provide complete booking transparency through real-time tracking.
* Build a scalable AI-powered service marketplace.

---

# Key Features

## Customer Platform

* AI Image Diagnosis
* AI Voice Diagnosis
* AI Text Diagnosis
* OCR Invoice & Warranty Analysis
* Intelligent Technician Recommendation
* Real-Time Technician Tracking
* Secure Online Booking
* Razorpay Payments
* AI Chat Assistant
* Booking History
* Maintenance History
* Service Status Tracking
* Booking Cancellation
* Personalized AI Recommendations
* Live Notifications

---

## Technician Platform

* Technician Dashboard
* Smart Job Assignment
* AI Service Summary
* Live Dispatch Panel
* Booking Acceptance
* Earnings Dashboard
* Subscription Plans
* Route Optimization
* Customer Information
* Complaint Center
* Digital Wallet
* QR Payment Support
* Analytics Dashboard
* Service History

---

## Administrator Platform

* Live Booking Monitoring
* Customer Management
* Technician Management
* Payment Monitoring
* Refund Dashboard
* Subscription Management
* Revenue Analytics
* Complaint Resolution
* Platform Analytics
* Booking Cancellation Review
* Technician Verification
* Performance Reports

---

# AI Architecture & Intelligent Features

FIXNOW is built around a multi-layer Artificial Intelligence architecture rather than relying on a single Large Language Model request.

Every AI interaction is processed through a structured reasoning pipeline powered by **CascadeFlow** and **Hindsight Memory**, enabling contextual understanding, memory-aware conversations, intelligent routing, and high-quality streaming responses.

This architecture enables FIXNOW to function as an intelligent service assistant instead of a conventional chatbot.

---

# CascadeFlow AI Orchestration

FIXNOW uses **CascadeFlow** as its primary AI orchestration framework.

Instead of sending raw prompts directly to a language model, CascadeFlow routes every interaction through multiple reasoning stages before generating the final response.

The processing pipeline is illustrated below.

```text
Customer Input
      │
      ▼
Context Builder
      │
      ▼
System Prompt Builder
      │
      ▼
Cascade Agent
      │
 ┌────┴────┐
 │         │
Drafter  Verifier
 │         │
 └────┬────┘
      ▼
Streaming Response
      │
      ▼
Memory Extraction
      │
      ▼
Hindsight Memory
```

This architecture provides:

* Multi-stage reasoning
* Intelligent response verification
* Context-aware AI conversations
* Streaming AI responses
* Lower inference cost
* Faster response generation
* Modular AI pipelines
* Improved output consistency

---

# Cascade Agent

Every AI request inside FIXNOW is executed through a dedicated Cascade Agent.

The Cascade Agent is responsible for:

* Intelligent model routing
* Prompt orchestration
* Context injection
* AI reasoning
* Structured response generation
* Streaming output
* Memory extraction
* Response verification

Rather than directly invoking an LLM, every AI interaction flows through this orchestration layer, ensuring higher quality responses and better scalability.

---

# Multi-Model AI Routing

FIXNOW has been designed with a provider-agnostic AI architecture.

Supported AI providers include:

* Groq (Primary Production Provider)
* Google Gemini
* OpenAI
* Hugging Face
* Vertex AI

Current production deployments primarily utilize **Groq's Llama 4 Scout** models for low-latency, high-performance inference.

---

# Hindsight Memory

FIXNOW integrates **Hindsight Memory** to provide persistent conversational intelligence.

Instead of treating every interaction as an isolated request, the AI remembers important customer and technician information across multiple conversations.

Separate memory banks are maintained for:

## Customer Memory

Examples include:

* Frequently booked services
* Previous conversations
* Maintenance history
* Appliance information
* Customer preferences
* Frequently selected technicians

## Technician Memory

Examples include:

* Frequently accepted services
* Customer feedback
* Performance metrics
* Service expertise
* Previous conversations
* Preferred working patterns

This allows the AI assistant to deliver personalized recommendations instead of generic responses.

---

# Memory Lifecycle

Every AI conversation follows a structured memory pipeline.

```text
Customer Message
        │
        ▼
Memory Recall
        │
        ▼
Context Builder
        │
        ▼
Prompt Builder
        │
        ▼
CascadeFlow
        │
        ▼
Streaming Response
        │
        ▼
Memory Extraction
        │
        ▼
Memory Retention
```

This continuous cycle enables FIXNOW to improve future interactions while maintaining relevant conversational context.

---

# AI Context Builder

Before every AI request, FIXNOW dynamically builds an intelligent context using multiple sources.

The generated context may include:

* Current conversation
* Previous conversations
* Customer profile
* Technician profile
* Booking history
* Maintenance logs
* Appliance details
* Previous AI diagnoses
* Location information
* Service preferences

The generated context is injected into the system prompt before model execution.

---

# AI Prompt Builder

FIXNOW dynamically generates specialized prompts depending on the requested workflow.

Supported workflows include:

* Image Diagnosis
* Voice Diagnosis
* Text Diagnosis
* OCR Analysis
* Customer Assistant
* Technician Assistant
* Booking Assistance
* Service Recommendation
* General AI Chat

This ensures consistent AI behavior throughout the platform.

---

# Streaming AI Responses

Instead of waiting for complete responses, FIXNOW streams AI output in real time.

Advantages include:

* Reduced perceived latency
* Faster user interactions
* Improved conversational experience
* Real-time token generation
* Better responsiveness during long AI tasks

---

# AI Diagnosis Engine

FIXNOW supports multiple intelligent diagnosis methods.

## Image Diagnosis

Customers can upload photographs of household issues.

The Computer Vision engine predicts:

* Service Category
* Problem Summary
* Severity
* Estimated Cost Range
* Estimated Repair Duration
* Required Tools
* Required Materials
* Safety Recommendations
* Urgency Level

Supported categories include:

* Plumbing
* Electrical
* HVAC
* Air Conditioner
* Refrigerator
* Washing Machine
* Electronics
* Smart Home
* Carpentry
* Cleaning
* Pest Control
* Painting
* Renovation
* Installation Services
* Kitchen Appliances
* Bike Mechanics
* Car Mechanics
* Rural Area Technicians

---

## Text Diagnosis

Customers may describe issues using natural language.

The AI extracts:

* Appliance type
* Technical keywords
* Failure symptoms
* Root cause
* Recommended repair
* Required technician category

---

## Voice Diagnosis

Customers can explain issues verbally.

Speech input is converted into structured service requests before entering the CascadeFlow reasoning pipeline.

---

## OCR Document Analysis

FIXNOW supports OCR analysis of:

* Product Invoices
* Purchase Receipts
* Warranty Cards
* Installation Documents

Automatically extracted information includes:

* Product Name
* Manufacturer
* Purchase Date
* Warranty Status
* Invoice Amount
* Product Type

The extracted information is incorporated into the AI context to improve diagnosis accuracy and maintenance history.

---

## Intelligent Technician Matching

Following diagnosis, FIXNOW recommends technicians using AI-assisted ranking.

Matching factors include:

* Service Category
* Technician Expertise
* Customer Location
* Distance
* Availability
* Rating
* Experience
* Historical Performance
* Subscription Priority
* AI Confidence Score
* Live GPS Location

Unlike traditional marketplaces that broadcast every request to every technician, FIXNOW intelligently dispatches bookings directly to the most suitable technician, significantly reducing response times and improving service quality.

---

# Why CascadeFlow + Hindsight?

Traditional AI assistants process each interaction independently.

FIXNOW combines **CascadeFlow** with **Hindsight Memory** to create a continuously learning AI ecosystem capable of:

* Remembering previous conversations
* Maintaining long-term context
* Producing verified responses
* Streaming responses in real time
* Routing requests intelligently
* Supporting multiple AI providers
* Delivering personalized recommendations for both customers and technicians

Together, these technologies form the foundation of FIXNOW's intelligent service ecosystem and enable a faster, smarter, and more reliable home services experience.

---

# Booking Workflow

## Step 1

Customer reports an issue using:

* Image
* Voice
* Text

↓

## Step 2

The AI Diagnosis Engine analyzes the request using CascadeFlow and Computer Vision.

↓

## Step 3

The platform predicts:

* Service Category
* Estimated Cost Range
* Estimated Repair Time
* Urgency
* Required Materials
* Required Tools

↓

## Step 4

AI recommends the most suitable technician based on intelligent ranking.

↓

## Step 5

Customer selects a technician and chooses a payment method.

* Booking Advance (Online)
* Pay After Service

↓

## Step 6

A Razorpay order is created securely before booking confirmation.

↓

## Step 7

Upon successful payment verification, the booking is created and assigned directly to the selected technician.

## Step 8

The selected technician receives the booking instantly through the Smart Dispatch System.

↓

## Step 9

The technician accepts the booking and navigates to the customer's location using live route optimization.

↓

## Step 10

Real-time technician tracking begins, allowing the customer to monitor arrival status.

↓

## Step 11

The technician performs inspection and completes the requested service.

↓

## Step 12

The remaining service amount is settled (if applicable), and the booking is archived into the customer's maintenance history.

---

# Smart Dispatch System

Unlike traditional service marketplaces where a booking is broadcast to every available technician, FIXNOW uses an intelligent dispatching engine that assigns the request directly to the most suitable technician.

The dispatch algorithm evaluates multiple factors before assigning a booking:

* Technician Service Category
* Live GPS Distance
* Availability Status
* Technician Rating
* Experience
* Subscription Priority
* AI Confidence Score
* Historical Performance
* Customer Location

This intelligent assignment minimizes response time, reduces technician competition, and improves customer satisfaction.

---

# Razorpay Payment Integration

FIXNOW integrates Razorpay to provide secure, production-ready online payments.

Supported payment capabilities include:

* Booking Advance Payments
* UPI
* Credit Cards
* Debit Cards
* Net Banking
* Wallets
* QR Code Payments
* Payment Verification
* Digital Receipts
* Signature Verification
* Refund Management

Every payment is verified server-side before a booking is confirmed.

---

# Production Booking Payment Workflow

```text
Customer
      │
      ▼
AI Diagnosis
      │
      ▼
Estimated Cost Generated
      │
      ▼
Booking Advance Payment
      │
      ▼
Create Razorpay Order
      │
      ▼
Secure Checkout
      │
      ▼
Payment Verification
      │
      ▼
Booking Created
      │
      ▼
Technician Assigned
      │
      ▼
Service Completed
      │
      ▼
Final Settlement
```

---

# Booking Fee Model

Instead of charging the complete estimated repair amount before inspection, FIXNOW follows a fair booking advance model.

Example:

Estimated Repair Cost

```
₹300 – ₹1,200
```

Customer pays only:

```
Booking Advance

₹150
```

After inspection:

Suppose the technician confirms:

```
Final Cost

₹780
```

Since the customer already paid the booking advance, only the remaining balance is collected after successful service completion.

Benefits include:

* Reduces fake bookings
* Prevents unnecessary cancellations
* Improves technician confidence
* Ensures transparent pricing
* Fair payment process for customers

---

# Cancellation & Refund Workflow

If an online-paid booking is cancelled:

1. Booking status is updated.
2. Payment details are preserved.
3. Administrator receives refund information.
4. Customer payment details are displayed securely in the Admin Dashboard.
5. Administrator initiates the Razorpay refund.
6. Refund status is recorded in the booking history.

---

# Live Tracking

Customers can monitor technician progress in real time.

Tracking features include:

* Live GPS Location
* Estimated Arrival Time
* Route Navigation
* Service Status Updates
* Arrival Notification
* Completion Notification

---

# Real-Time Communication

FIXNOW uses Socket.IO for low-latency bidirectional communication.

Real-time events include:

* Booking Requests
* Technician Assignment
* Booking Acceptance
* Live Status Updates
* Location Tracking
* Customer Notifications
* Admin Notifications

---

# Authentication

Authentication is powered by Firebase Authentication.

Supported authentication methods include:

* Email & Password
* Google Sign-In

Role-based access is enforced for:

* Customers
* Technicians
* Administrators

Every protected route validates user roles before granting access.

---

# Database

FIXNOW uses Firebase Firestore as its primary cloud database.

Collections include:

```text
users
technicians
bookings
payments
subscriptions
maintenanceLogs
notifications
complaints
analytics
reviews
```

---

# Cloud Infrastructure

## Frontend

* Next.js
* Vercel

## Backend

* Node.js
* Express.js
* Render

## Database

* Firebase Firestore

## Authentication

* Firebase Authentication

## AI

* CascadeFlow
* Groq Llama 4 Scout
* Hindsight Memory

## Maps

* Google Maps Platform

## Image Storage

* Cloudinary

## Payments

* Razorpay

---

# Technology Stack

## Frontend

* Next.js 16
* React 18
* TypeScript
* Tailwind CSS
* Framer Motion
* Radix UI
* Lucide React
* Axios

---

## Backend

* Node.js
* Express.js
* REST APIs
* Socket.IO

---

## Artificial Intelligence

* CascadeFlow
* Hindsight Memory
* Groq Llama 4 Scout
* Computer Vision
* OCR
* Prompt Engineering
* Context Builder
* Memory Extraction
* Streaming AI

---

## Database

* Firebase Firestore

---

## Authentication

* Firebase Authentication

---

## Mapping & Location

* Google Maps JavaScript API
* Directions API
* Geolocation API

---

## Payments

* Razorpay Checkout
* Razorpay Orders API
* Razorpay Payment Verification

---

# Project Structure

```text
FIXNOW
│
├── frontend
│   ├── src
│   │   ├── app
│   │   ├── components
│   │   ├── hooks
│   │   ├── lib
│   │   │   ├── ai
│   │   │   │   ├── cascadeflow
│   │   │   │   ├── hindsight
│   │   │   │   ├── gateway
│   │   │   │   ├── builders
│   │   │   │   └── service
│   │   ├── server
│   │   └── styles
│   ├── public
│   └── package.json
│
├── backend
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── services
│   ├── utils
│   ├── config
│   └── server.js
│
├── ml
│
└── README.md
```

---

# Installation

Clone the repository:

```bash
git clone https://github.com/syedmohammedrayan/FIXNOW.git
```

### Frontend

```bash
cd frontend

pnpm install

pnpm dev
```

### Backend

```bash
cd backend

npm install

npm start
```

---

# Environment Variables

## Frontend (.env.local)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=

NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=

NEXT_PUBLIC_FIREBASE_PROJECT_ID=

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=

NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=

NEXT_PUBLIC_FIREBASE_APP_ID=

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

NEXT_PUBLIC_RAZORPAY_KEY_ID=

NEXT_PUBLIC_API_BASE=
```

---

## Backend (.env)

```env
PORT=

JWT_SECRET=

FIREBASE_PROJECT_ID=

FIREBASE_CLIENT_EMAIL=

FIREBASE_PRIVATE_KEY=

GOOGLE_MAPS_API_KEY=

GROQ_API_KEY=

RAZORPAY_KEY_ID=

RAZORPAY_KEY_SECRET=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=
```

---

# Security

FIXNOW follows industry-standard security practices.

Security measures include:

* Firebase Authentication
* HTTPS Communication
* Role-Based Authorization
* Secure Environment Variables
* Server-side Razorpay Signature Verification
* Protected REST APIs
* Secure Firestore Rules
* Backend Payment Validation
* Booking Ownership Validation

---

# Future Roadmap

Planned future enhancements include:

* AI Predictive Maintenance
* IoT Device Monitoring
* AR Repair Assistance
* Voice Calling Between Customers and Technicians
* AI Dynamic Pricing
* Smart Warranty Detection
* Emergency Technician Dispatch
* Multi-City Expansion
* AI Fraud Detection
* Technician Skill Verification
* Service Recommendation Engine
* Preventive Maintenance Scheduling

---

# Contributors

**Syed Mohammed Rayan**

Bachelor of Engineering (Computer Science Engineering)

Muffakham Jah College of Engineering & Technology

---

# License

This project is intended for educational, research, portfolio, and demonstration purposes.

Commercial deployment requires compliance with the licenses and terms of all third-party platforms and services used, including Firebase, Google Maps Platform, Groq, Razorpay, and other integrated providers.

---

# Vision

FIXNOW aims to redefine the home services industry by combining Artificial Intelligence, Computer Vision, Contextual Memory, Intelligent Dispatching, and Secure Digital Payments into a unified service ecosystem.

By integrating CascadeFlow orchestration, Hindsight Memory, AI-powered diagnostics, real-time technician tracking, and intelligent payment workflows, FIXNOW delivers a faster, smarter, and more transparent experience for customers, technicians, and administrators alike.

Our vision is to build an intelligent service marketplace where technology not only connects people with professionals but also understands problems, remembers user preferences, learns from every interaction, and continuously improves the overall service experience through AI-driven automation.

