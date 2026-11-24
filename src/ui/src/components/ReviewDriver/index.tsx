import React, { useState, useEffect, useRef } from 'react'
import { Keyboard } from 'react-native'
import { useForm } from 'react-hook-form'

import { ReviewDriverParams } from '../../types'
import { useReviewCommentList } from '../../utils'

import { Content } from './styles'
import {
  CommentField,
  QuickComments,
  ReviewBlocks,
  ReviewContinue,
  ReviewedNotice,
  ReviewHeader,
  ReviewSpinner,
  ReviewThumb,
  ThumbsRating,
  useReviewContentStyle
} from '../ReviewOrder/ReviewForm'

import { useLanguage, useToast, ToastType, ReviewDriver as ReviewDriverController } from '@components'

const ReviewDriverUI = (props: ReviewDriverParams) => {
  const {
    order,
    formState,
    dirverReviews,
    setDriverReviews,
    handleSendDriverReview,
    onNavigationRedirect,
  } = props

  const [, t] = useLanguage()
  const contentStyle = useReviewContentStyle()
  const { handleSubmit, formState: { errors } } = useForm()
  const [, { showToast }] = useToast()
  const scrollref = useRef<any>(null)

  const [isDriverReviewed, setIsDriverReviewed] = useState(false)
  const [qualification, setQualification] = useState(5)

  const [comments, setComments] = useState<Array<any>>([])
  const [extraComment, setExtraComment] = useState('')
  const [alertState, setAlertState] = useState<{ open: boolean, content: Array<any>, success?: boolean }>({ open: false, content: [], success: false })

  const commentsList = useReviewCommentList('driver')

  const onSubmit = () => {
    if (dirverReviews?.qualification === 0) {
      setAlertState({
        open: true,
        content: dirverReviews?.qualification === 0 ? [`${t('REVIEW_QUALIFICATION_REQUIRED', 'Review qualification is required')}`] : []
      })
      return
    }
    handleSendDriverReview()
    setAlertState({ ...alertState, success: true })
  }

  const isSelectedComment = (commentKey: number) => {
    const found = comments.find((comment: any) => comment?.key === commentKey)
    return found
  }

  const handleChangeComment = (commentItem: any) => {
    const found = comments.find((comment: any) => comment?.key === commentItem.key)
    if (found) {
      const _comments = comments.filter((comment: any) => comment?.key !== commentItem.key)
      setComments(_comments)
    } else {
      setComments([...comments, commentItem])
    }
  }

  const handleChangeQualification = (qualification: number) => {
    if (qualification) setDriverReviews({ ...dirverReviews, qualification: qualification, comment: '' })
    setComments([])
    setQualification(qualification)
  }

  const handleSendReviewClick = () => {
    if (!order?.user_review && !isDriverReviewed) {
      onSubmit()
    } else {
      onNavigationRedirect('BottomTab', { screen: 'MyOrders' })
    }
  }

  useEffect(() => {
    if (!formState.loading && formState.result?.error) {
      setAlertState({
        open: true,
        success: false,
        content: formState.result?.result || [t('ERROR', 'Error')]
      })
    }
    if (!formState.loading && !formState.result?.error && alertState.success) {
      setIsDriverReviewed && setIsDriverReviewed(true)
      onNavigationRedirect('BottomTab', { screen: 'MyOrders' })
    }
  }, [formState])

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      // Convert all errors in one string to show in toast provider
      const list = Object.values(errors);
      let stringError = '';
      list.map((item: any, i: number) => {
        stringError +=
          i + 1 === list.length ? `- ${item.message}` : `- ${item.message}\n`;
      });
      showToast(ToastType.Error, stringError);
    }
  }, [errors])

  useEffect(() => {
    if (alertState.open) {
      alertState.content && showToast(
        ToastType.Error,
        alertState.content
      )
    }
  }, [alertState.content])

  useEffect(() => {
    let _comments = ''
    if (comments.length > 0) {
      comments.map((comment: any) => (_comments += comment.content + '. '))
    }
    const _comment = _comments + extraComment
    setDriverReviews({ ...dirverReviews, comment: _comment })
  }, [comments, extraComment])

  useEffect(() => {
    // Removes only its own listener: removeAllListeners also dropped the ones of
    // the support bubble, sheets and forms mounted elsewhere.
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      scrollref?.current?.scrollToEnd && scrollref.current.scrollToEnd()
    })
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    if (!formState?.result?.result) {
      setDriverReviews({ ...dirverReviews, qualification: qualification })
    }
  }, [qualification])

  return (
    <>
      <Content
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentStyle}
        ref={scrollref}
      >
        <ReviewHeader
          title={t('RATE_THE_EXPERIENCE', 'Rate the experience')}
          subtitle={order?.driver ? `${t('HOW_WAS_YOUR_EXPERIENCE_WITH', 'How was your experience with')} ${order?.driver?.name}?` : null}
        >
          <ReviewThumb uri={order?.driver?.photo} />
        </ReviewHeader>
        {order?.review || (formState?.result?.result && !formState?.result?.error) ? (
          <ReviewedNotice text={t('ORDER_REVIEWED', 'This order has been already reviewed')} />
        ) : (
          <ReviewBlocks
            rating={
              <ThumbsRating
                value={qualification}
                onChange={handleChangeQualification}
                likeLabel={t('LIKE', 'Like')}
                dislikeLabel={t('DISLIKE', 'Dislike')}
              />
            }
            quickComments={
              <QuickComments
                title={commentsList[qualification]?.title}
                items={commentsList[qualification]?.list}
                isSelected={(key) => !!isSelectedComment(key)}
                onToggle={handleChangeComment}
              />
            }
            comment={
              <CommentField
                label={t('REVIEW_COMMENT_QUESTION', 'Do you want to add something?')}
                placeholder={t('COMMENTS', 'Comments')}
                onChange={setExtraComment}
              />
            }
          />
        )}
        <ReviewSpinner visible={formState.loading} />
      </Content>
      <ReviewContinue
        text={t('CONTINUE', 'Continue')}
        onClick={handleSubmit(handleSendReviewClick)}
      />
    </>
  )
}

export const ReviewDriver = (props: any) => {
  const reviewDriverProps = {
    ...props,
    UIComponent: ReviewDriverUI,
    isToast: true
  }
  return <ReviewDriverController {...reviewDriverProps} />
}
