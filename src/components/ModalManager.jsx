"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import StudentModal from "./modals/StudentModal";
import ScoreModal from "./modals/ScoreModal";
import ModulAjarModal from "./modals/ModulAjarModal";

// Import other modals as needed, for now using stubs if original code is lost, 
// but I will try to implement them based on memory/logic
import DeleteConfirmModal from "./modals/DeleteConfirmModal";
import TPConfigModal from "./modals/TPConfigModal";
import WeightSettingsModal from "./modals/WeightSettingsModal";
import ProfileModal from "./modals/ProfileModal";
import JournalModal from "./modals/JournalModal";
import ScheduleModal from "./modals/ScheduleModal";
import ClassJournalModal from "./modals/ClassJournalModal";
import TeacherJournalModal from "./modals/TeacherJournalModal";
import TeacherModal from "./modals/TeacherModal";

export default function ModalManager() {
    const { state } = useApp();
    const { showModal, modalType, showDeleteConfirm } = state;

    return (
        <>
            {showModal && (
                <>
                    {modalType === "student" && <StudentModal />}
                    {modalType === "journal" && <JournalModal />}
                    {modalType === "profile" && <ProfileModal />}
                    {modalType === "score" && <ScoreModal />}
                    {modalType === "tp-config" && <TPConfigModal />}
                    {modalType === "weight-settings" && <WeightSettingsModal />}
                    {modalType === "modul-ajar" && <ModulAjarModal />}
                    {modalType === "schedule" && <ScheduleModal />}
                    {modalType === "journal_class" && <ClassJournalModal />}
                    {modalType === "journal_teacher" && <TeacherJournalModal />}
                    {modalType === "teacher" && <TeacherModal />}
                </>
            )}

            {showDeleteConfirm && <DeleteConfirmModal />}
        </>
    );
}
