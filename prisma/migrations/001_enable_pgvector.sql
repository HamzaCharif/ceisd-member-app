-- Migration: 001_enable_pgvector
-- Enables the pgvector extension required for AI embedding storage (Agent 5)
-- Run this BEFORE any Prisma migrations

CREATE EXTENSION IF NOT EXISTS vector;
