import React, { useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { useTheme } from 'styled-components/native'
import { useSchoolStudents, useLanguage } from '@components'
import { OButton, OText } from '../shared'
import { PressableScale } from '../shared/PressableScale'
import { StudentFormModal } from '../StudentFormModal'
import { themeSpace } from '@/theme/helpers'
import { Wrapper, Header, Empty } from './styles'

export const StudentsList = (_props: any) => {
  const [, t] = useLanguage()
  const theme: any = useTheme()
  // An outline card: `card` background, radius and padding with a thin border.
  const styles = useMemo(() => {
    const card = theme.native.components.card.base
    return StyleSheet.create({
      card: {
        backgroundColor: card.background,
        borderRadius: card.radius,
        paddingVertical: themeSpace(theme, 'md'),
        paddingHorizontal: card.padding,
        marginBottom: themeSpace(theme, 'sm'),
        ...(theme.native.components.card.base.border ?? {})
      }
    })
  }, [theme])
  const { students, loading, refresh } = useSchoolStudents()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (student: any) => { setEditing(student); setFormOpen(true) }

  return (
    <Wrapper>
      <Header>
        <OButton size='sm' text={t('SCHOOL_ADD_STUDENT', 'Add student')} onClick={openCreate} />
      </Header>
      <ScrollView showsVerticalScrollIndicator={false}>
        {loading
          ? (
            <Empty><OText>{t('LOADING', 'Loading')}</OText></Empty>
            )
          : students.length === 0
            ? (
              <Empty><OText>{t('SCHOOL_NO_STUDENTS_YET', 'You have no registered students yet. Add one to start ordering for them.')}</OText></Empty>
              )
            : students.map((student: any) => (
              <PressableScale key={student.id} style={styles.card} onPress={() => openEdit(student)}>
                <OText preset='body_lg' weight='bold'>{student.name} {student.lastname}</OText>
                <OText preset='body_sm' color={theme.native.components.list_row.base.subtitle_color}>
                  {[student.school?.name, student.classroom?.name, student.grade?.name].filter(Boolean).join(' · ') || '-'}
                </OText>
              </PressableScale>
            ))}
      </ScrollView>
      {formOpen && (
        <StudentFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          student={editing}
          onSaved={() => refresh()}
        />
      )}
    </Wrapper>
  )
}
