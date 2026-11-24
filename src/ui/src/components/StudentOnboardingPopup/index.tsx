import React, { useState } from 'react'
import { useSchoolStudents, useLanguage, useSelectedStudent, useSession } from '@components'
import { OButton, OModal, OText } from '../shared'
import { StudentFormModal } from '../StudentFormModal'
import { Content, StudentButton, EmptyMessage } from './styles'

export const StudentOnboardingPopup = (props: any) => {
  const { business, forceOpen, onForceClose } = props
  const [, t] = useLanguage()
  const [{ auth }] = useSession()
  const { students, loading, refresh }: any = useSchoolStudents()
  const { studentId: selected, setStudentId } = useSelectedStudent(business?.slug)
  const [dismissed, setDismissed] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  const controlled = forceOpen !== undefined
  const isSchool = business?.vertical === 'school'
  const schoolStudents = students.filter((s: any) => Number(s.school_id ?? s.school?.id) === Number(business?.id))
  const open = isSchool && auth && !formOpen &&
    (controlled ? forceOpen : (!selected && !dismissed && !loading && schoolStudents.length > 1))

  const handleClose = () => {
    if (controlled) onForceClose && onForceClose()
    else setDismissed(true)
  }

  const pick = (studentId: any) => {
    setStudentId(studentId)
    setDismissed(true)
    if (controlled) onForceClose && onForceClose()
  }

  const handleSaved = (createdStudent: any) => {
    refresh()
    if (createdStudent?.id) pick(createdStudent.id)
  }

  return (
    <>
      <OModal
        open={open}
        onClose={handleClose}
        title={t('SCHOOL_WHO_ORDERING_FOR', 'Who are you ordering for?')}
      >
        <Content>
          {schoolStudents.length === 0
            ? (
              <EmptyMessage>
                <OText preset='body'>{t('SCHOOL_NO_STUDENTS_REGISTERED', 'You have no registered students for this school yet. Add one to start ordering.')}</OText>
              </EmptyMessage>
              )
            : schoolStudents.map((student: any) => (
              <StudentButton key={student.id} onPress={() => pick(student.id)}>
                <OText preset='body_lg'>{student.name} {student.lastname}</OText>
              </StudentButton>
            ))}
          <OButton text={t('SCHOOL_ADD_STUDENT', 'Add student')} onClick={() => setFormOpen(true)} />
        </Content>
      </OModal>
      {formOpen && (
        <StudentFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          defaultSchoolId={business?.id}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
