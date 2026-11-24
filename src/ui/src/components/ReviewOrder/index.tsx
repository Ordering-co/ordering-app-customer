import React, { useState, useEffect, useRef } from 'react'
import { Keyboard } from 'react-native';
import { useForm } from 'react-hook-form'

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
} from './ReviewForm'

import { useReviewCommentList } from '../../utils'
import { useSendResult } from '@/navigators/appNavigation'
import { ReviewOrderParams } from '../../types'

import { OrderReview as ReviewOrderController, useLanguage, useToast, ToastType } from '@components'

export const ReviewOrderUI = (props: ReviewOrderParams) => {
  const {
    stars,
    handleSendReview,
    formState,
    navigation,
    setStars,
    onNavigationRedirect,
    handleChangeFormState
  } = props

  const contentStyle = useReviewContentStyle()
  // The order's details, below: it stops offering the review once it is sent.
  const tellOrderDetails = useSendResult(navigation, 'OrderDetails')

  const [, t] = useLanguage()
  const [, { showToast }] = useToast()
  const { handleSubmit, control, formState: { errors } } = useForm()
  const scrollref = useRef<any>(null)

  const [alertState, setAlertState] = useState<{ open: boolean, content: Array<any>, success?: boolean }>({ open: false, content: [], success: false })
  const [comments, setComments] = useState<Array<any>>([])
  const [extraComment, setExtraComment] = useState('')
  const [enableProduct, setEnableProduct] = useState(true)
  const [qualification, setQualification] = useState(5)
  const [currentValue, setCurrentValue] = useState(5)
  const [order, setOrderState] = useState<any>(props.order);

  useEffect(() => {
    setOrderState(props.order)
  }, [props.order])

  const onSubmit = async () => {
    if (Object.values(stars).some((value: any) => value === 0)) {
      setAlertState({
        open: true,
        content: stars.quality === 0 ? [`${t('REVIEW_QUALIFICATION_REQUIRED', 'Review qualification is required')}`] : []
      })
      return
    }
    const res = await handleSendReview()
    if (res) {
      tellOrderDetails({ reviewed: true })
      setOrderState({ ...order, review: true })
      showToast(ToastType.Success, t('ORDER_REVIEW_SUCCESS_CONTENT', 'Thank you, Order review successfully submitted!'))
      onNavigationRedirect && onNavigationRedirect('ReviewProducts', { order: { ...order, review: null } })
    }
    !enableProduct && navigation?.canGoBack() && navigation.goBack()
  }

  const commentsList = useReviewCommentList('order')

  const handleChangeComment = (commentItem: any) => {
    const found = comments.find((comment: any) => comment?.key === commentItem.key)
    if (found) {
      const _comments = comments.filter((comment: any) => comment?.key !== commentItem.key)
      setComments(_comments)
    } else {
      setComments([...comments, commentItem])
    }
  }

  const isSelectedComment = (commentKey: number) => {
    const found = comments.find((comment: any) => comment?.key === commentKey)
    return found
  }

  const handleContinueClick = () => {
    if (!order?.review) {
      onSubmit()
    } else {
      skipOrderReview()
    }
  }

  const skipOrderReview = () => {
    if (enableProduct) onNavigationRedirect('ReviewProducts', { order: { ...order, review: null } })
    else if (order?.driver && !order?.user_review) {
      onNavigationRedirect('ReviewDriver', { order: { ...order, review: null } })
    } else {
      navigation?.canGoBack() && navigation.goBack()
    }
  }

  const handleChangeQualification = (index: number) => {
    if (qualification === index) return
    setQualification(index)
    setComments([])
  }

  useEffect(() => {
    if (formState.error && !formState.loading) {
      showToast(ToastType.Error, formState.result)
    }
  }, [formState.result])

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors)
        .map((item: any) => `- ${item.message}`)
        .join('\n');
      showToast(ToastType.Error, errorMessages);
    }
  }, [errors]);

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
      comments.map(comment => _comments += comment.content + '. ')
    }
    let _comment
    _comment = _comments + extraComment
    setStars({ ...stars, comments: _comment })
  }, [comments, extraComment])

  useEffect(() => {
    setEnableProduct(!order?.products.every((product: any) => product?.deleted))
  }, [order])

  useEffect(() => {
    const value = qualification ? 5 : 1
    setCurrentValue(value)
    if (value !== currentValue) setComments([])
    if (comments?.length === 0 && !extraComment && formState.changes?.length === 0 && qualification === 5) return
    let _comments = ''
    if (comments.length > 0) {
      comments.map(comment => (_comments += comment.content + '. '))
    }
    const _comment = _comments + extraComment
    let found = false
    const _changes = formState?.changes?.map((item: any) => {
      if (item?.order_id === order?.id) {
        found = true
        return {
          order_id: order?.id,
          comment: _comment,
          qualification: qualification
        }
      }
      return item
    })
    if (!found) {
      _changes.push({
        order_id: order?.id,
        comment: _comment,
        qualification: qualification
      })
    }
    handleChangeFormState && handleChangeFormState(_changes)
  }, [comments, extraComment, qualification])

  useEffect(() => {
    // Removes only its own listener: removeAllListeners also dropped the ones of
    // the support bubble, sheets and forms mounted elsewhere.
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      scrollref?.current?.scrollToEnd && scrollref.current.scrollToEnd()
    })
    return () => subscription.remove()
  }, [])

  return (
    <>
      <Content
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentStyle}
        ref={scrollref}
      >
        <ReviewHeader
          title={t('RATE_THE_EXPERIENCE', 'Rate the experience')}
          subtitle={order?.business ? `${t('HOW_WAS_YOUR_EXPERIENCE_WITH', 'How was your experience with')} ${order?.business?.length > 1 ? order?.business?.map((business: any) => business?.name).join(', ') : order?.business[0]?.name || order?.business?.name}?` : null}
        >
          {order?.business?.length > 0
            ? order?.business?.map((business: any) => <ReviewThumb key={business?.id} uri={business?.logo} />)
            : <ReviewThumb uri={order?.business?.logo} />}
        </ReviewHeader>
        {order?.review || (formState?.result?.order_id && !formState?.result?.error) ? (
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
        onClick={handleSubmit(handleContinueClick)}
      />
    </>
  )
}

export const ReviewOrder = (props: ReviewOrderParams) => {
  const reviewOrderProps = {
    ...props,
    UIComponent: ReviewOrderUI,
    defaultStar: props?.defaultStar || 5
  }
  return <ReviewOrderController {...reviewOrderProps} />
}
