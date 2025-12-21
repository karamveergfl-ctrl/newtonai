CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



SET default_table_access_method = heap;

--
-- Name: search_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    search_query text NOT NULL,
    is_question boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: study_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    pdf_name text NOT NULL,
    session_start timestamp with time zone DEFAULT now() NOT NULL,
    session_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: video_watch_time; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_watch_time (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    video_id text NOT NULL,
    watch_duration_seconds integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: search_history search_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_history
    ADD CONSTRAINT search_history_pkey PRIMARY KEY (id);


--
-- Name: study_sessions study_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_sessions
    ADD CONSTRAINT study_sessions_pkey PRIMARY KEY (id);


--
-- Name: video_watch_time video_watch_time_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_watch_time
    ADD CONSTRAINT video_watch_time_pkey PRIMARY KEY (id);


--
-- Name: search_history Users can insert their own search history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own search history" ON public.search_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: study_sessions Users can insert their own study sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own study sessions" ON public.study_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: video_watch_time Users can insert their own video watch time; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own video watch time" ON public.video_watch_time FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: study_sessions Users can update their own study sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own study sessions" ON public.study_sessions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: video_watch_time Users can update their own video watch time; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own video watch time" ON public.video_watch_time FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: search_history Users can view their own search history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own search history" ON public.search_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: study_sessions Users can view their own study sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own study sessions" ON public.study_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: video_watch_time Users can view their own video watch time; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own video watch time" ON public.video_watch_time FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: search_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

--
-- Name: study_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: video_watch_time; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_watch_time ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;