import React from 'react'
import { useSchoolStudents, useLanguage } from '@components'
import { OText } from '../shared'
import { Container, Inner } from './styles'

export const OrderStudentInfo = (props: any) => {
  const { order } = props
  const [, t] = useLanguage()
  const { students } = useSchoolStudents()

  const studentId = order?.student?.id ?? order?.student_id
  if (!studentId) return null
  const student = order?.student || students.find((s: any) => s.id === Number(studentId))
  if (!student) return null

  const meta = [student.classroom?.name, student.grade?.name].filter(Boolean).join(' · ')

  return (
    <Container>
      <Inner>
        <OText preset='h4' weight='bold'>{t('SCHOOL_STUDENT', 'Student')}</OText>
        <OText preset='body'>{student.name} {student.lastname}</OText>
        {!!meta && <OText preset='body_sm' color='text_muted'>{meta}</OText>}
      </Inner>
    </Container>
  )
}
